import { defineEventHandler, readBody } from 'h3'
import { confirmPaid } from '../../../services/paygate.service'

/**
 * 模拟网关回调：POST { transact } → 订单置已支付
 * 网关约定响应纯文本 "success" / "fail"（非 JSON）
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const transact = String(body.transact || '')
  if (!transact) {
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'fail'
  }

  const result = await confirmPaid(transact)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return result.ok ? 'success' : 'fail'
})
