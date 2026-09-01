import { defineEventHandler } from 'h3'
import { getChannelByModel, epayGateway } from '../../../services/paygate.service'

/**
 * 易支付骨架：生成跳转链接（还原 getCallbackUrl/getNotifyUrl 形态）
 * GET ?transact=&vid=&title=&money=
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const transact = String(q.transact || '')
  const vid = Number(q.vid || 0)
  const title = String(q.title || '知识付费')
  const money = Number(q.money || 0)

  const channel = await getChannelByModel('epay')
  if (!channel) {
    return { code: 0, msg: '易支付通道未配置', data: null }
  }

  const host = (getRequestHeaders(event)['host'] || 'localhost:3000')
  const scheme = (getRequestHeaders(event)['x-forwarded-proto'] || 'http').split(',')[0].trim()
  const launch = await epayGateway.createOrder(
    {
      transact,
      vid,
      title,
      moneyCents: Math.round(money * 100),
      notifyUrl: `${scheme}://${host}/api/pay/epay/notify`,
      returnUrl: `${scheme}://${host}/api/pay/epay/return`,
    },
    channel,
  )

  return { code: 1, msg: 'success', data: launch }
})
