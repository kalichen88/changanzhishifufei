import { defineEventHandler } from 'h3'
import { decodeTransact } from '../../../utils/hashids'
import { prisma } from '../../../utils/prisma'

/**
 * 易支付同步跳转（还原 getCallbackUrl 形态）
 * 前端在此页轮询 /api/h5/pay/status
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const encoded = String(q.transact || q.out_trade_no || '')
  let orderSn = encoded
  if (!/^\d+$/.test(encoded)) {
    const decoded = decodeTransact(encoded)
    if (decoded) orderSn = decoded
  }

  const order = orderSn ? await prisma.payOrder.findUnique({ where: { transact: orderSn } }) : null
  return {
    code: 1,
    msg: order?.status === 1 ? '支付成功' : '未支付',
    data: { paid: order?.status === 1, transact: orderSn, vid: order?.vid },
  }
})
