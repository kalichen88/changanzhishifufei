import { defineEventHandler, readBody } from 'h3'
import { getChannelByModel, epayGateway } from '../../../services/paygate.service'
import { confirmPaid } from '../../../services/paygate.service'

/**
 * 易支付异步通知（还原 getNotifyUrl 形态）
 * 验签 → confirmPaid → 响应 "success"
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(body)) {
    params[k] = String(v)
  }

  const channel = await getChannelByModel('epay')
  if (!channel) {
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'fail'
  }

  const check = await epayGateway.handleNotify(params, channel)
  if (!check.ok || !check.orderSn) {
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'fail'
  }

  const result = await confirmPaid(check.orderSn)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return result.ok ? 'success' : 'fail'
})
