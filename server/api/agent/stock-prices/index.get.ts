import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'
import { getConfigInt } from '../../../utils/config'

/**
 * GET /api/agent/stock-prices 公共片库 + 我的独立定价
 * 返回：默认价（config price）、我的覆盖价（stock_prices）
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))
  const keyword = String(q.keyword || '').trim()

  const where: any = { status: 1, uid: 0 }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { cid: Number(keyword) || 0 },
    ]
  }

  const defaultPrice = await getConfigInt('price')
  const [list, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stock.count({ where }),
  ])

  const myPrices = await prisma.stockPrice.findMany({
    where: { uid: me.id, stockId: { in: list.map((s) => s.id) } },
  })
  const priceMap = new Map(myPrices.map((p) => [p.stockId, Number(p.price)]))

  return {
    code: 1,
    msg: 'success',
    data: {
      list: list.map((s) => ({
        ...s,
        defaultPrice,
        myPrice: priceMap.get(s.id) ?? null,
      })),
      total,
      page,
      pageSize,
      defaultPrice,
    },
  }
})
