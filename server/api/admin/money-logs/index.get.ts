import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/money-logs 余额流水（biz/代理筛选，含扣量标） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 20)))
  const where: any = {}
  if (q.biz && q.biz !== 'all') where.biz = String(q.biz)
  if (q.uid) where.uid = Number(q.uid)

  const [list, total] = await Promise.all([
    prisma.moneyLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.moneyLog.count({ where }),
  ])

  const uids = [...new Set(list.map((l) => l.uid))]
  const agents = uids.length
    ? await prisma.admin.findMany({ where: { id: { in: uids } }, select: { id: true, username: true, nickname: true } })
    : []
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  return {
    code: 1,
    msg: 'success',
    data: { list: list.map((l) => ({ ...l, agent: agentMap.get(l.uid) || null })), total, page, pageSize },
  }
})
