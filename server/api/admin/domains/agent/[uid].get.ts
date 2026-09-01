import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'

/** GET /api/admin/domains/agent/:uid 某代理已绑定域名 */
export default defineEventHandler(async (event) => {
  const uid = Number(getRouterParam(event, 'uid'))
  if (!uid) return { code: 0, msg: '参数错误', data: null }
  const list = await prisma.domainLib.findMany({
    where: { uid, isBind: 1, status: { not: -1 } },
    orderBy: { type: 'asc' },
  })
  return { code: 1, msg: 'success', data: { list } }
})
