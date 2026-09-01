import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/orders 订单列表（状态/扣量/代理/IP 筛选） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 20)))
  const where: any = {}

  if (q.status !== undefined && q.status !== '') where.status = Number(q.status)
  if (q.is_kouliang !== undefined && q.is_kouliang !== '') where.isKouliang = Number(q.is_kouliang)
  if (q.agent_id) where.uid = Number(q.agent_id)
  if (q.keyword) {
    const kw = String(q.keyword).trim()
    where.OR = [{ transact: { contains: kw } }, { ip: { contains: kw } }]
  }
  if (q.start) {
    where.payTime = { gte: new Date(String(q.start)) }
  }

  const [list, total] = await Promise.all([
    prisma.payOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payOrder.count({ where }),
  ])

  // 关联代理与视频标题
  const uids = [...new Set(list.map((o) => o.uid))]
  const vids = [...new Set(list.map((o) => o.vid).filter(Boolean))]
  const [agents, stocks] = await Promise.all([
    uids.length
      ? prisma.admin.findMany({ where: { id: { in: uids } }, select: { id: true, username: true, nickname: true } })
      : Promise.resolve([]),
    vids.length
      ? prisma.stock.findMany({ where: { id: { in: vids } }, select: { id: true, title: true } })
      : Promise.resolve([]),
  ])
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  const stockMap = new Map(stocks.map((s) => [s.id, s]))
  const rows = list.map((o) => ({
    ...o,
    agent: agentMap.get(o.uid) || null,
    stock: stockMap.get(o.vid) || null,
  }))

  return { code: 1, msg: 'success', data: { list: rows, total, page, pageSize } }
})
