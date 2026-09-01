import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveAgent } from '../../../services/h5.service'
import { getRealIp } from '../../../utils/ip'
import { readIdentity } from '../../../services/fingerprint.service'
import { genTransact } from '../../../utils/order'
import { getConfigInt } from '../../../utils/config'
import { toCents, centsToDecimal } from '../../../utils/money'
import { getRedis, redisIncr } from '../../../utils/redis'
import { countOrder } from '../../../services/stats.service'
import { getGateway, getChannelByModel } from '../../../services/paygate.service'

/**
 * 下单（还原 Trading::index + createOrder，见文档 8.5 / 8.7.7）
 * POST body: { f, vid, is_date?, is_month?, is_week?, model? }
 * 返回：{ code:1, msg:'success', data:{ transact, mode, payUrl, price } }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const f = String(body.f || '')
  const vid = Number(body.vid || 0)
  const isDate = Number(body.is_date || 0) === 2 ? 2 : 1
  const isMonth = Number(body.is_month || 0) === 2 ? 2 : 1
  const isWeek = Number(body.is_week || 0) === 2 ? 2 : 1
  const model = String(body.model || '')

  const agent = await resolveAgent(f)
  if (!agent || agent.status !== 'normal') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '该用户已经被禁用!', data: null }
  }

  const stock = await prisma.stock.findUnique({ where: { id: vid } })
  if (!stock) {
    return { code: 0, msg: '视频资源丢失!', data: null }
  }

  const ip = getRealIp(event)
  const identity = readIdentity(event, ip)
  const ua = identity.fp || identity.uaMd5

  // 防刷：单 IP / 单指纹下单频率（Redis）
  const date = new Date().toISOString().slice(0, 10)
  const r = getRedis()
  const [ipCount, fpCount] = await Promise.all([
    redisIncr(`rate_pay_${ip}_${date}`),
    redisIncr(`rate_pay_${ua}_${date}`),
  ]).catch(() => [0, 0])
  await Promise.all([
    r.expire(`rate_pay_${ip}_${date}`, 86400).catch(() => {}),
    r.expire(`rate_pay_${ua}_${date}`, 86400).catch(() => {}),
  ])
  if (ipCount > 60 || fpCount > 60) {
    setResponseStatus(event, 429)
    return { code: 0, msg: '操作过于频繁，请稍后再试', data: null }
  }

  // 金额计算（还原原版 createOrder）
  let payMoney = 0
  let payDesc = '支付'
  if (isDate === 2) {
    payMoney = agent.dateFee
  } else if (isMonth === 2) {
    payMoney = agent.monthFee
    payDesc = '支付_3'
  } else if (isWeek === 2) {
    payMoney = agent.weekFee
    payDesc = '支付_3'
  } else {
    const sp = await prisma.stockPrice.findUnique({ where: { uid_stockId: { uid: agent.id, stockId: vid } } })
    payMoney = sp && Number(sp.price) > 0 ? Number(sp.price) : await getConfigInt('price')
  }
  if (payMoney <= 0) {
    return { code: 0, msg: '该商品暂未定价', data: null }
  }

  // 支付通道：请求指定 → 代理 pay_model → 站长 pay_model
  let channelModel = model
  if (!channelModel) {
    channelModel = agent.payModel
    if (!channelModel || channelModel === '0' || channelModel === '') {
      const owner = await prisma.admin.findUnique({ where: { id: 1 } })
      channelModel = owner?.payModel || 'mock'
    }
  }
  if (channelModel === '0' || channelModel === '') channelModel = 'mock'
  const gateway = getGateway(channelModel)
  if (!gateway) {
    return { code: 0, msg: '支付通道未启用', data: null }
  }

  const transact = genTransact()
  const moneyCents = toCents(String(payMoney))

  // 写订单
  await prisma.payOrder.create({
    data: {
      transact,
      uid: agent.id,
      pid: agent.pid,
      pidTop: agent.pidTop,
      vid,
      user: 'sb',
      price: centsToDecimal(moneyCents),
      ip,
      ua: ua?.slice(0, 255) || null,
      isKouliang: 1,
      isDate,
      isWeek,
      isMonth,
      payChannel: channelModel,
      status: 2,
      des: payDesc,
    },
  })

  // Redis 当日下单流水
  await countOrder(agent.id, transact)

  // 网关拉起
  const channel = await getChannelByModel(channelModel)
  const host = getRequestHost(event)
  const scheme = getRequestProtocol(event)
  const notifyUrl = `${scheme}://${host}/api/pay/${channelModel === 'epay' ? 'epay/notify' : 'mock/callback'}`
  const returnUrl = `${scheme}://${host}/api/pay/${channelModel === 'epay' ? 'epay/return' : 'mock/callback'}`

  const launch = await gateway.createOrder(
    {
      transact,
      vid,
      title: stock.title,
      moneyCents,
      notifyUrl,
      returnUrl,
    },
    channel || { model: channelModel, appId: '', appKey: '', payUrl: '' },
  )

  return {
    code: 1,
    msg: 'success',
    data: {
      transact,
      price: payMoney,
      desc: isMonth === 2 ? '包月' : isWeek === 2 ? '包周' : isDate === 2 ? '包日' : '单片',
      ...launch,
      statusUrl: `/api/h5/pay/status?transact=${transact}`,
    },
  }
})

function getRequestHost(event: any): string {
  return (getRequestHeaders(event)['host'] || 'localhost:3000')
}

function getRequestProtocol(event: any): string {
  const fwd = getRequestHeaders(event)['x-forwarded-proto'] || ''
  return fwd.split(',')[0].trim() || 'http'
}
