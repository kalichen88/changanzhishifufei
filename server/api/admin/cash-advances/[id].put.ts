import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'
import { decimalToCents, centsToDecimal } from '../../../utils/money'

/**
 * PUT /api/admin/cash-advances/:id 审核提现
 * action: pass(通过待打款) | reject(驳回) | paid(确认打款)
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const action = String(body.action || '')
  const remark = String(body.remark || '')
  if (!id) return { code: 0, msg: '参数错误', data: null }

  const cash = await prisma.cashAdvance.findUnique({ where: { id } })
  if (!cash) return { code: 0, msg: '提现申请不存在', data: null }

  if (action === 'pass') {
    if (cash.status !== 0) return { code: 0, msg: '仅待审状态可通过', data: null }
    await prisma.cashAdvance.update({
      where: { id },
      data: { status: 1, adminNote: remark || cash.adminNote },
    })
    await writeAdminLog(event, { title: '提现审核', content: `通过提现申请 ID:${id}（金额 ${cash.money}）` })
  } else if (action === 'reject') {
    if (cash.status !== 0) return { code: 0, msg: '仅待审状态可驳回', data: null }
    await prisma.cashAdvance.update({
      where: { id },
      data: { status: 2, adminNote: remark || '驳回' },
    })
    await writeAdminLog(event, { title: '提现审核', content: `驳回提现申请 ID:${id}` })
  } else if (action === 'paid') {
    if (cash.status !== 1) return { code: 0, msg: '仅通过状态可确认打款', data: null }

    const agent = await prisma.admin.findUnique({ where: { id: cash.uid } })
    if (!agent) return { code: 0, msg: '代理不存在', data: null }
    const balanceCents = decimalToCents(agent.balance)
    const moneyCents = decimalToCents(cash.money)
    if (balanceCents < moneyCents) return { code: 0, msg: '代理余额不足，无法打款', data: null }
    const afterCents = balanceCents - moneyCents

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: cash.uid },
        data: { balance: centsToDecimal(afterCents) },
      }),
      prisma.moneyLog.create({
        data: {
          uid: cash.uid,
          money: centsToDecimal(moneyCents),
          before: centsToDecimal(balanceCents),
          after: centsToDecimal(afterCents),
          type: 2,
          biz: 'cash',
          memo: `【提现打款】申请ID:${cash.id}`,
        },
      }),
      prisma.cashAdvance.update({
        where: { id },
        data: { status: 3, adminNote: remark || cash.adminNote },
      }),
    ])
    await writeAdminLog(event, { title: '提现打款', content: `确认打款 ID:${id}（金额 ${cash.money}）` })
  } else {
    return { code: 0, msg: '未知操作', data: null }
  }

  return { code: 1, msg: 'success', data: { id } }
})
