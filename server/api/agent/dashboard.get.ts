import { defineEventHandler } from 'h3'
import { agentDashboard } from '../../services/stats.service'
import { currentAdmin } from '../../utils/admin'
import { prisma } from '../../utils/prisma'

/** GET /api/agent/dashboard 代理数据面板 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }

  const stats = await agentDashboard(me.id)
  const agent = await prisma.admin.findUnique({
    where: { id: me.id },
    select: {
      id: true, username: true, nickname: true, balance: true, kouliang: true,
      ticheng: true, pid: true, pidTop: true, viewId: true, status: true,
    },
  })
  const recentOrders = await prisma.payOrder.findMany({
    where: { uid: me.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      transact: true, vid: true, price: true, status: true, isKouliang: true, createdAt: true,
    },
  })
  return { code: 1, msg: 'success', data: { ...stats, agent, recentOrders } }
})
