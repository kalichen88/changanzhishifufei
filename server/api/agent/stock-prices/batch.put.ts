import { defineEventHandler, readBody } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'
import { toCents, centsToDecimal } from '../../../utils/money'
import { getConfigInt } from '../../../utils/config'

/**
 * PUT /api/agent/stock-prices/batch 一键批量改价（还原原版 gx）
 * body: { price, mode: 'set'|'add'|'sub' }
 * - set：全部设为 price 元
 * - add：在现有定价（无则默认价）上加 price 元
 * - sub：在现有定价（无则默认价）上减 price 元（不低于 0）
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const body = await readBody(event).catch(() => ({}))
  const price = Number(body.price)
  const mode = String(body.mode || 'set')
  if (!price || Number.isNaN(price) || price <= 0) {
    return { code: 0, msg: '请输入正确的价格', data: null }
  }

  const publicStocks = await prisma.stock.findMany({
    where: { uid: 0, status: 1 },
    select: { id: true },
  })
  if (publicStocks.length === 0) {
    return { code: 0, msg: '公共片库为空', data: null }
  }

  const ids = publicStocks.map((s) => s.id)
  const existing = await prisma.stockPrice.findMany({ where: { uid: me.id, stockId: { in: ids } } })
  const priceMap = new Map(existing.map((p) => [p.stockId, Number(p.price)]))

  // 默认价兜底
  const defaultPrice = Number((await getConfigInt('price')) || 0)

  const ops = publicStocks.map((s) => {
    const baseCents = priceMap.get(s.id) !== undefined ? toCents(String(priceMap.get(s.id))) : toCents(String(defaultPrice))
    let targetCents: number
    if (mode === 'add') {
      targetCents = baseCents + toCents(String(price))
    } else if (mode === 'sub') {
      targetCents = Math.max(0, baseCents - toCents(String(price)))
    } else {
      targetCents = toCents(String(price))
    }
    return prisma.stockPrice.upsert({
      where: { uid_stockId: { uid: me.id, stockId: s.id } },
      create: { uid: me.id, stockId: s.id, price: centsToDecimal(targetCents) },
      update: { price: centsToDecimal(targetCents) },
    })
  })
  await prisma.$transaction(ops)

  return { code: 1, msg: 'success', data: { changed: ops.length } }
})
