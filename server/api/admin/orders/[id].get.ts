import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/orders/:id 订单详情 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const order = await prisma.payOrder.findUnique({ where: { id } })
  if (!order) return { code: 0, msg: '订单不存在', data: null }

  const [agent, stock, logs] = await Promise.all([
    prisma.admin.findUnique({ where: { id: order.uid }, select: { id: true, username: true, nickname: true } }),
    order.vid ? prisma.stock.findUnique({ where: { id: order.vid }, select: { id: true, title: true, img: true } }) : null,
    prisma.moneyLog.findMany({ where: { orderSn: order.transact }, orderBy: { createdAt: 'asc' } }),
  ])

  return { code: 1, msg: 'success', data: { order, agent, stock, logs } }
})
