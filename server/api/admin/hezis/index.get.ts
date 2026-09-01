import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/hezis 盒子链接列表 */
export default defineEventHandler(async () => {
  const list = await prisma.hezi.findMany({ orderBy: { id: 'desc' } })
  const uids = [...new Set(list.map((h) => h.uid))]
  const agents = uids.length
    ? await prisma.admin.findMany({ where: { id: { in: uids } }, select: { id: true, username: true, nickname: true } })
    : []
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  return {
    code: 1,
    msg: 'success',
    data: { list: list.map((h) => ({ ...h, agent: agentMap.get(h.uid) || null })) },
  }
})
