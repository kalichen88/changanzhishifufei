import { prisma } from '../utils/prisma'
import { getRedis, redisIncr, redisZAdd } from '../utils/redis'

/**
 * Redis 计数与统计聚合（见文档 8.7.3 Key 全集）
 * 所有「今日/实时」优先读 Redis，落库兜底；对账以 DB 为准
 */

const day = (d = new Date()) => d.toISOString().slice(0, 10)

/** 访问计数（还原 accessStatistical，仅 index 入口） */
export async function countAccess(uid: number, ip: string): Promise<void> {
  const date = day()
  const r = getRedis()
  await Promise.all([
    redisIncr(`access_${uid}_${date}_${ip}`),
    redisIncr(`hour_access_${uid}_${date}_${new Date().getHours()}`),
  ]).catch(() => {})
  await r.expire(`access_${uid}_${date}_${ip}`, 86400).catch(() => {})
}

/** 下单计数（order_{uid}_{date} ZSET） */
export async function countOrder(uid: number, transact: string): Promise<void> {
  await redisZAdd(`order_${uid}_${day()}`, Date.now(), transact)
}

/** 单日成交单数（DB 兜底） */
export async function todayPaidCount(uid?: number, date = new Date()): Promise<number> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return prisma.payOrder.count({
    where: {
      status: 1,
      payTime: { gte: start, lt: end },
      ...(uid ? { uid } : {}),
    },
  })
}

/** 单日成交额（分，DB 兜底） */
export async function todayPaidSumCents(uid?: number, date = new Date()): Promise<number> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const agg = await prisma.payOrder.aggregate({
    where: { status: 1, payTime: { gte: start, lt: end }, ...(uid ? { uid } : {}) },
    _sum: { price: true },
  })
  const v = agg._sum.price
  return v ? Math.round(Number(v.toString()) * 100) : 0
}

/** 今日扣量单数（当日 is_kouliang=2） */
export async function todayKouliangCount(date = new Date()): Promise<number> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return prisma.payOrder.count({
    where: { status: 1, isKouliang: 2, payTime: { gte: start, lt: end } },
  })
}

export interface DashboardStats {
  todayOrders: number
  todayIncomeCents: number
  todayKouliang: number
  yesterdayOrders: number
  yesterdayIncomeCents: number
  yesterdayKouliang: number
  agentCount: number
  stockCount: number
  monthOrders: number
}

/** 总后台看板聚合 */
export async function adminDashboard(): Promise<DashboardStats> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const monthStart = new Date(now)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [todayOrders, todayIncome, todayKl, yOrders, yIncome, yKl, agentCount, stockCount, monthOrders] =
    await Promise.all([
      todayPaidCount(),
      todayPaidSumCents(),
      todayKouliangCount(now),
      todayPaidCount(undefined, yesterday),
      todayPaidSumCents(undefined, yesterday),
      todayKouliangCount(yesterday),
      prisma.admin.count({ where: { role: 'agent' } }),
      prisma.stock.count({ where: { status: 1 } }),
      prisma.payOrder.count({ where: { status: 1, payTime: { gte: monthStart } } }),
    ])

  return {
    todayOrders,
    todayIncomeCents: todayIncome,
    todayKouliang: todayKl,
    yesterdayOrders: yOrders,
    yesterdayIncomeCents: yIncome,
    yesterdayKouliang: yKl,
    agentCount,
    stockCount,
    monthOrders,
  }
}

/** 代理面板（名下=本人 + 全部下级 pidTop 归属本人） */
export async function agentDashboard(uid: number): Promise<DashboardStats> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const monthStart = new Date(now)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const agent = await prisma.admin.findUnique({ where: { id: uid } })
  if (!agent) throw new Error('代理不存在')
  const scope = agent.role === 'admin' ? {} : agent.pid === 0 ? { pidTop: uid } : { uid }

  const [todayOrders, todayIncome, todayKl, yOrders, yIncome, yKl, monthOrders, balance] = await Promise.all([
    prisma.payOrder.count({ where: { status: 1, ...scope, payTime: { gte: startOfDay(now), lt: startOfDay(addDays(now, 1)) } } }),
    (async () => {
      const a = await prisma.payOrder.aggregate({
        where: { status: 1, ...scope, payTime: { gte: startOfDay(now), lt: startOfDay(addDays(now, 1)) } },
        _sum: { price: true },
      })
      return a._sum.price ? Math.round(Number(a._sum.price.toString()) * 100) : 0
    })(),
    prisma.payOrder.count({ where: { status: 1, isKouliang: 2, ...scope, payTime: { gte: startOfDay(now), lt: startOfDay(addDays(now, 1)) } } }),
    prisma.payOrder.count({ where: { status: 1, ...scope, payTime: { gte: startOfDay(yesterday), lt: startOfDay(now) } } }),
    (async () => {
      const a = await prisma.payOrder.aggregate({
        where: { status: 1, ...scope, payTime: { gte: startOfDay(yesterday), lt: startOfDay(now) } },
        _sum: { price: true },
      })
      return a._sum.price ? Math.round(Number(a._sum.price.toString()) * 100) : 0
    })(),
    prisma.payOrder.count({ where: { status: 1, isKouliang: 2, ...scope, payTime: { gte: startOfDay(yesterday), lt: startOfDay(now) } } }),
    prisma.payOrder.count({ where: { status: 1, ...scope, payTime: { gte: monthStart } } }),
    agent.balance,
  ])

  const balanceCents = balance ? Math.round(Number(balance.toString()) * 100) : 0
  return {
    todayOrders,
    todayIncomeCents: todayIncome,
    todayKouliang: todayKl,
    yesterdayOrders: yOrders,
    yesterdayIncomeCents: yIncome,
    yesterdayKouliang: yKl,
    agentCount: 0,
    stockCount: 0,
    monthOrders,
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
