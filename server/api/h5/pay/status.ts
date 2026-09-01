import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { decodeTransact } from '../../../utils/hashids'

/**
 * 轮询支付结果（还原 Trading::checkOrderStatus，见文档 8.7.7）
 * 入参：transact = 25 位 hashids 编码的订单号；兼容明文订单号
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const encoded = String(q.transact || '')
  if (!encoded) {
    return { code: 0, msg: 'notPay', data: null }
  }

  // 优先按明文订单号查；若长度非纯数字（hashids 25 位）则解码
  let orderSn = encoded
  if (!/^\d+$/.test(encoded)) {
    const decoded = decodeTransact(encoded)
    if (decoded) orderSn = decoded
  }

  const order = await prisma.payOrder.findUnique({ where: { transact: orderSn } })
  if (!order) {
    return { code: 0, msg: 'notPay', data: null }
  }
  if (order.status === 1) {
    return { code: 1, data: order, msg: 'success' }
  }
  return { code: 0, msg: 'notPay', data: order }
})
