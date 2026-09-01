import { defineEventHandler } from 'h3'
import { adminDashboard } from '../../services/stats.service'
import { prisma } from '../../utils/prisma'

/** GET /api/admin/dashboard 总后台数据看板（含今日扣量） */
export default defineEventHandler(async () => {
  const stats = await adminDashboard()

  // 补充：各代理余额 top、今日新访客、最近订单
  const [agentBalances, todayVisitors, recentOrders] = await Promise.all([
    prisma.admin.findMany({
      where: { role: 'agent' },
      select: { id: true, username: true, nickname: true, balance: true, status: true },
      orderBy: { balance: 'desc' },
      take: 10,
    }),
    prisma.visitorTrack.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.payOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        transact: true, uid: true, vid: true, price: true, status: true,
        isKouliang: true, createdAt: true,
      },
    }),
  ])

  return {
    code: 1,
    msg: 'success',
    data: { ...stats, agentBalances, todayVisitors, recentOrders },
  }
})
