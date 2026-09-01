import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/domains 域名库列表（类型/状态筛选） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const type = q.type ? Number(q.type) : undefined
  const status = q.status !== undefined ? Number(q.status) : undefined
  const keyword = String(q.keyword || '').trim()
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 50)))

  const where: any = {}
  if (type) where.type = type
  if (status !== undefined && status !== -99) where.status = status
  if (keyword) where.domain = { contains: keyword }

  const [list, total] = await Promise.all([
    prisma.domainLib.findMany({
      where,
      orderBy: [{ type: 'asc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.domainLib.count({ where }),
  ])

  // 附加绑定代理信息
  const uids = [...new Set(list.map((d) => d.uid).filter(Boolean))]
  const agents = uids.length
    ? await prisma.admin.findMany({
        where: { id: { in: uids } },
        select: { id: true, username: true, nickname: true },
      })
    : []
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  const rows = list.map((d) => ({
    ...d,
    bindAgent: d.uid && d.uid > 0 ? agentMap.get(d.uid) || null : null,
  }))

  return { code: 1, msg: 'success', data: { list: rows, total, page, pageSize } }
})
