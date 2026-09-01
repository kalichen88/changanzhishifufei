import type { Prisma } from '@prisma/client'
import { decimalToCents, centsToDecimal } from '../utils/money'
import { buildChain, computeMultiLevelCommission, type CommissionEntry } from './commission.service'

/**
 * 扣量 + 分账核心（还原原版 Pay.php::saveOrder，见文档 8.1）
 *
 * 幂等 / 并发安全由调用方 confirmPaid 负责：
 *   - 订单行 FOR UPDATE
 *   - 链上代理行 FOR UPDATE
 *   - 全部写操作与订单状态变更在同一事务内
 */

export interface SettlementInput {
  /** 卖单代理行（已锁定） */
  agent: {
    id: number
    pid: number
    pidTop: number
    username: string
    kouliang: number
    ticheng: number
    balance: unknown // Prisma Decimal
  }
  transact: string
  /** 订单金额（分） */
  moneyCents: number
  /** 卖单代理名下已支付订单总数（含此前扣量单，须在本单置已支付前取值） */
  paidCount: number
  multiLevelEnabled: boolean
}

export interface SettlementResult {
  isKouliang: 1 | 2
  /** 实际入账人（分账受益方） */
  creditedUid: number
  /** 入账明细（用于余额 + 流水写入） */
  entries: CommissionEntry[]
}

/**
 * 扣量判定（纯函数，可单测）
 * 仅当 pid>0 且 kouliang>0 才可能扣；count>0 且 count%kouliang==0 → 扣量
 */
export function judgeKouliang(agent: SettlementInput['agent'], paidCount: number): 1 | 2 {
  if (agent.pid <= 0 || agent.kouliang <= 0) return 1
  if (paidCount > 0 && paidCount % agent.kouliang === 0) return 2
  return 1
}

/**
 * 分账落库（必须在事务内调用）
 * 返回扣量标记 + 入账人 + 明细；由调用方据此写余额与流水。
 */
export async function settleOrder(
  tx: Prisma.TransactionClient,
  input: SettlementInput,
): Promise<SettlementResult> {
  const { agent, transact, moneyCents, paidCount, multiLevelEnabled } = input

  const isKouliang = judgeKouliang(agent, paidCount) as 1 | 2

  let entries: CommissionEntry[]
  let creditedUid: number

  if (isKouliang === 2) {
    // 扣量单：全额入 pidTop（pid>0 才可能扣，故恒入 pidTop）
    creditedUid = agent.pidTop > 0 ? agent.pidTop : agent.id
    entries = [
      {
        uid: creditedUid,
        amountCents: moneyCents,
        biz: 'kouliang',
        memo: `【扣量订单】单号:${transact} 代理ID:${agent.id} 代理名称:${agent.username}`,
      },
    ]
  } else {
    // 非扣量单：多级分账
    creditedUid = agent.id
    if (multiLevelEnabled) {
      const chain = await buildChain(tx, agent.id)
      entries = computeMultiLevelCommission(chain, moneyCents, transact)
    } else {
      // 仅一级（还原原版非注释路径）
      const tichengPrice = Math.floor((moneyCents * agent.ticheng) / 100)
      entries = [
        {
          uid: agent.id,
          amountCents: moneyCents - tichengPrice,
          biz: 'income',
          memo: `【打赏收入】单号:${transact}`,
        },
      ]
      if (tichengPrice > 0 && agent.pid > 0) {
        entries.push({
          uid: agent.pid,
          amountCents: tichengPrice,
          biz: 'ticheng',
          memo: `【分销抽成】单号:${transact};提成抽取比例${agent.ticheng}%;代理【${agent.username}】ID:${agent.id}`,
        })
      }
    }
  }

  // 逐条入账：写余额 + 流水（事务内，锁已持有）
  for (const e of entries) {
    const admin = await tx.admin.findUnique({ where: { id: e.uid } })
    if (!admin) continue
    const beforeCents = decimalToCents(admin.balance)
    const afterCents = beforeCents + e.amountCents
    await tx.admin.update({
      where: { id: e.uid },
      data: { balance: centsToDecimal(afterCents) },
    })
    await tx.moneyLog.create({
      data: {
        uid: e.uid,
        money: centsToDecimal(e.amountCents),
        before: centsToDecimal(beforeCents),
        after: centsToDecimal(afterCents),
        type: 1,
        biz: e.biz,
        memo: e.memo,
        orderSn: transact,
      },
    })
  }

  return { isKouliang, creditedUid, entries }
}
