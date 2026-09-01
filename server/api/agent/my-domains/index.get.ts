import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'

/** GET /api/agent/my-domains 我的独立域名（含推广主链） */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const list = await prisma.domainLib.findMany({
    where: { uid: me.id, status: 1 },
    orderBy: { id: 'asc' },
  })
  return { code: 1, msg: 'success', data: { list } }
})
