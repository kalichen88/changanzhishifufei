import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/cash-advances 提现申请列表 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 20)))
  const where: any = {}
  if (q.status !== undefined && q.status !== '') where.status = Number(q.status)
  if (q.agent_id) where.uid = Number(q.agent_id)

  const [list, total] = await Promise.all([
    prisma.cashAdvance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashAdvance.count({ where }),
  ])

  const uids = [...new Set(list.map((c) => c.uid))]
  const agents = uids.length
    ? await prisma.admin.findMany({ where: { id: { in: uids } }, select: { id: true, username: true, nickname: true } })
    : []
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  return {
    code: 1,
    msg: 'success',
    data: { list: list.map((c) => ({ ...c, agent: agentMap.get(c.uid) || null })), total, page, pageSize },
  }
})
