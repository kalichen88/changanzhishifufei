import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'

/** GET /api/agent/mubans 模板列表（含我的当前模板 view_id） */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const [list, agent] = await Promise.all([
    prisma.muban.findMany({
      where: { status: '1' },
      orderBy: { id: 'asc' },
      select: { id: true, title: true, muban: true, image: true, desc: true, status: true },
    }),
    prisma.admin.findUnique({ where: { id: me.id }, select: { viewId: true } }),
  ])
  return { code: 1, msg: 'success', data: { list, myViewId: agent?.viewId || 0 } }
})
