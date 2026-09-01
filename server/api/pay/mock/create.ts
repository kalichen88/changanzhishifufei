import { defineEventHandler } from 'h3'

/**
 * 模拟网关：支付页入口
 * 前端在此页面点"模拟支付成功" → POST /api/pay/mock/callback → confirmPaid
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const transact = String(q.transact || '')
  return {
    code: 1,
    msg: 'success',
    data: {
      transact,
      mode: 'mock',
      tip: '模拟支付页：点击"模拟支付成功"完成支付',
    },
  }
})
