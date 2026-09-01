import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { writeAdminLog } from '../../../../utils/admin'
import { decimalToCents, centsToDecimal } from '../../../../utils/money'

/**
 * POST /api/admin/admins/:id/balance 调整余额
 * body: { amount: 正负金额(元), memo }
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const amountCents = Math.round(Number(body.amount || 0) * 100)
  const memo = String(body.memo || '手动调整')
  if (!id || amountCents === 0) return { code: 0, msg: '请输入调整金额', data: null }

  const admin = await prisma.admin.findUnique({ where: { id } })
  if (!admin) return { code: 0, msg: '代理不存在', data: null }

  const beforeCents = decimalToCents(admin.balance)
  const afterCents = beforeCents + amountCents
  if (afterCents < 0) return { code: 0, msg: '余额不足以扣减', data: null }

  await prisma.$transaction([
    prisma.admin.update({
      where: { id },
      data: { balance: centsToDecimal(afterCents) },
    }),
    prisma.moneyLog.create({
      data: {
        uid: id,
        money: centsToDecimal(Math.abs(amountCents)),
        before: centsToDecimal(beforeCents),
        after: centsToDecimal(afterCents),
        type: amountCents > 0 ? 1 : 2,
        biz: 'adjust',
        memo,
      },
    }),
  ])

  await writeAdminLog(event, {
    title: '调整余额',
    content: `代理 ${admin.username}（ID:${id}）余额调整 ${(amountCents / 100).toFixed(2)} 元：${memo}`,
  })
  return { code: 1, msg: 'success', data: { id, balance: centsToDecimal(afterCents) } }
})
