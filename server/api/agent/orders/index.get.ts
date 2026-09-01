import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'

/** GET /api/agent/orders?status=&is_kouliang= 名下订单（含扣量状态） */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))

  const where: any = { uid: me.id }
  if (q.status !== undefined && q.status !== '') where.status = Number(q.status)
  if (q.is_kouliang !== undefined && q.is_kouliang !== '') where.isKouliang = Number(q.is_kouliang)

  const [list, total] = await Promise.all([
    prisma.payOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payOrder.count({ where }),
  ])

  // 补充视频标题
  const vids = [...new Set(list.map((o) => o.vid))]
  const stocks = vids.length
    ? await prisma.stock.findMany({ where: { id: { in: vids } }, select: { id: true, title: true } })
    : []
  const stockMap = new Map(stocks.map((s) => [s.id, s]))

  return {
    code: 1,
    msg: 'success',
    data: {
      list: list.map((o) => ({ ...o, stock: stockMap.get(o.vid) || null })),
      total,
      page,
      pageSize,
    },
  }
})
