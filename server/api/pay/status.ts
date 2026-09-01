import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { decodeTransact } from '../../utils/hashids'

/**
 * 统一查单（网关层，见文档 6.2）
 * GET ?transact=（明文订单号或 25 位 hashids）
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const encoded = String(q.transact || '')
  if (!encoded) {
    return { code: 0, msg: 'notPay', data: null }
  }
  let orderSn = encoded
  if (!/^\d+$/.test(encoded)) {
    const decoded = decodeTransact(encoded)
    if (decoded) orderSn = decoded
  }
  const order = await prisma.payOrder.findUnique({ where: { transact: orderSn } })
  if (!order || order.status !== 1) {
    return { code: 0, msg: 'notPay', data: null }
  }
  return { code: 1, data: order, msg: 'success' }
})
