import type { Prisma } from '@prisma/client'
import { percentOf } from '../utils/money'

/**
 * 多级分销提成（补全原版注释掉的 jisuan()，见文档 8.1）
 *
 * 链式定义：selling(本代理) ← 直接上级 ← … ← 顶级(pid=0)
 * 每个节点的 ticheng 表示「给直接上级」的百分比。
 *
 * 分配算法（流水式差额瀑布，财务自洽，任一链合计恒 = 100%）：
 *
 *   selling 入账  = M - M * ticheng[selling] / 100   （卖单代理先按自己提成比例上交）
 *   flow          = M * ticheng[selling] / 100       （实际流入上一级的金额）
 *
 *   自下而上逐级：本级「应上交」needUp = M * ticheng[本级] / 100（顶级为 0，吸收剩余）
 *     本级入账 = max(flow - needUp, 0)   // 收到的大于要交的，差额归己
 *     flow     = min(flow, needUp)       // 实际再上交 = 收到的与要交的较小者
 *     防倒挂：本级收到不足上交额 → 全量上交、不截留（本级 0，同时链在此截断）
 *
 * 示例：订单 M，链 B(ticheng=10)→A(ticheng=20)→admin(ticheng=0)
 *   B 入账 M*90%，flow=M*10%
 *   A：needUp=M*20% > flow → A 入账 0，flow 仍 M*10%
 *   admin：needUp=0 → 吸收剩余 M*10%
 *   合计 90%+0%+10% = 100% ✓（不会超额分配）
 */
export interface ChainNode {
  id: number
  pid: number
  username: string
  ticheng: number
}

export interface CommissionEntry {
  uid: number
  amountCents: number // 入账分
  biz: 'income' | 'ticheng' | 'kouliang'
  memo: string
}

/**
 * 沿 pid 链上溯到顶，返回 [selling, parent, ..., top]
 * 必须在事务内调用（tx），链上代理行已由调用方 FOR UPDATE 锁定。
 */
export async function buildChain(
  tx: Prisma.TransactionClient,
  sellingUid: number,
): Promise<ChainNode[]> {
  const chain: ChainNode[] = []
  const seen = new Set<number>()
  let cur = await tx.admin.findUnique({
    where: { id: sellingUid },
    select: { id: true, pid: true, username: true, ticheng: true },
  })
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    chain.push({
      id: cur.id,
      pid: cur.pid,
      username: cur.username,
      ticheng: cur.ticheng,
    })
    if (cur.pid === 0) break
    cur = await tx.admin.findUnique({
      where: { id: cur.pid },
      select: { id: true, pid: true, username: true, ticheng: true },
    })
  }
  return chain
}

/**
 * 计算非扣量单的多级分账明细（金额以「分」传入）
 * 返回入账条目（含 selling 自身），由调用方在同一事务内写余额与流水。
 */
export function computeMultiLevelCommission(
  chain: ChainNode[],
  moneyCents: number,
  transact: string,
): CommissionEntry[] {
  if (chain.length === 0 || moneyCents <= 0) return []
  const entries: CommissionEntry[] = []

  const selling = chain[0]
  // 1. 本代理：100% - 自身 ticheng
  const sellingIncome = moneyCents - percentOf(moneyCents, selling.ticheng)
  if (sellingIncome > 0) {
    entries.push({
      uid: selling.id,
      amountCents: sellingIncome,
      biz: 'income',
      memo: `【打赏收入】单号:${transact}`,
    })
  }

  // 实际流入上一级的金额（流水）
  let flow = percentOf(moneyCents, selling.ticheng)
  if (flow <= 0) return entries // 无上流金额，链截断

  // 2. 自下而上逐级分配（顶级吸收剩余）
  for (let k = 1; k < chain.length; k++) {
    const lower = chain[k - 1]
    const cur = chain[k]
    const isTop = cur.pid === 0 || k === chain.length - 1
    // 顶级应上交 0（吸收剩余）；中间层按自身 ticheng 上交
    const needUp = isTop ? 0 : percentOf(moneyCents, cur.ticheng)
    const keep = flow - needUp
    if (keep > 0) {
      const keepPct = Math.round((keep / moneyCents) * 100)
      entries.push({
        uid: cur.id,
        amountCents: keep,
        biz: 'ticheng',
        memo: `【分销抽成】单号:${transact};提成抽取比例${keepPct}%;代理【${lower.username}】ID:${lower.id}`,
      })
    }
    flow = Math.min(flow, needUp)
    if (flow <= 0) break // 已无上流金额
  }

  return entries
}
