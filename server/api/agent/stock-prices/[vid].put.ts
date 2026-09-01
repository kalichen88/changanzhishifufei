import { defineEventHandler, readBody } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'
import { toCents, centsToDecimal } from '../../../utils/money'

/**
 * PUT /api/agent/stock-prices/:vid 单视频独立定价
 * body: { price }（0 表示恢复默认）
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const vid = Number(getRouterParam(event, 'vid'))
  const body = await readBody(event).catch(() => ({}))
  const price = Number(body.price)
  if (!vid) return { code: 0, msg: '参数错误', data: null }

  const stock = await prisma.stock.findUnique({ where: { id: vid } })
  if (!stock || stock.uid !== 0) return { code: 0, msg: '视频不存在', data: null }

  const priceCents = toCents(String(Math.max(0, price)))
  if (priceCents <= 0) {
    // 恢复默认：删除覆盖价
    await prisma.stockPrice.deleteMany({ where: { uid: me.id, stockId: vid } })
    return { code: 1, msg: '已恢复默认价格', data: { vid, price: null } }
  }

  await prisma.stockPrice.upsert({
    where: { uid_stockId: { uid: me.id, stockId: vid } },
    create: { uid: me.id, stockId: vid, price: centsToDecimal(priceCents) },
    update: { price: centsToDecimal(priceCents) },
  })
  return { code: 1, msg: 'success', data: { vid, price } }
})
