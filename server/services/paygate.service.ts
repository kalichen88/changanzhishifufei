import { prisma } from '../utils/prisma'
import { getRedis, redisSetNX, redisZAdd } from '../utils/redis'
import { decimalToCents, centsToDecimal } from '../utils/money'
import { md5Hex } from '../utils/order'
import { settleOrder } from './kouliang.service'
import { writePayedShow } from './entitlement.service'

/**
 * 支付网关抽象（见文档 8.5）+ 统一落单 confirmPaid
 *
 * 适配器：mock（模拟网关，默认启用） / epay（易支付骨架，默认禁用）
 * 接入真实通道时只需新增适配器并实现四个方法。
 */

export interface GatewayOrderParams {
  transact: string
  vid: number
  title: string
  moneyCents: number // 分
  notifyUrl: string
  returnUrl: string
}

export interface PayGateway {
  model: string
  /** 发起支付，返回前端可用的拉起信息 */
  createOrder(params: GatewayOrderParams, channel: PayChannelInfo): Promise<{
    mode: 'url' | 'qr' | 'form' | 'mock'
    payUrl?: string
    qrCode?: string
    form?: string
  }>
  /** 异步通知验签，返回订单号 */
  handleNotify(body: Record<string, string>, channel: PayChannelInfo): Promise<{ ok: boolean; orderSn?: string; raw?: unknown }>
}

export interface PayChannelInfo {
  model: string
  appId: string
  appKey: string
  payUrl: string
}

// ---------- mock 网关 ----------
export const mockGateway: PayGateway = {
  model: 'mock',
  async createOrder(params) {
    return { mode: 'mock', payUrl: `/api/pay/mock/create?transact=${params.transact}` }
  },
  async handleNotify(body) {
    return { ok: true, orderSn: body.transact, raw: body }
  },
}

// ---------- epay（易支付 v4）骨架 ----------
function epaySign(params: Record<string, string>, key: string): string {
  const filtered: Record<string, string> = {}
  for (const k of Object.keys(params).sort()) {
    if (k === 'sign' || k === 'sign_type' || params[k] === '' || params[k] == null) continue
    filtered[k] = params[k]
  }
  const str = Object.entries(filtered)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return md5Hex(`${str}${key}`).toUpperCase()
}

export const epayGateway: PayGateway = {
  model: 'epay',
  async createOrder(params, channel) {
    const arg: Record<string, string> = {
      pid: channel.appId,
      type: '1', // 1=微信 2=支付宝（占位固定微信）
      out_trade_no: params.transact,
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      name: params.title.slice(0, 60),
      money: (params.moneyCents / 100).toFixed(2),
      sign_type: 'MD5',
    }
    arg.sign = epaySign(arg, channel.appKey)
    const base = channel.payUrl || 'https://pay.example.com'
    const qs = new URLSearchParams(arg).toString()
    return { mode: 'url', payUrl: `${base}/submit.php?${qs}` }
  },
  async handleNotify(body, channel) {
    const { sign, ...rest } = body
    const expect = epaySign(rest, channel.appKey)
    if (!sign || sign !== expect) return { ok: false }
    if (body.trade_status !== 'TRADE_SUCCESS' && body.status !== '1') return { ok: false }
    return { ok: true, orderSn: body.out_trade_no, raw: body }
  },
}

const gateways: Record<string, PayGateway> = {
  mock: mockGateway,
  epay: epayGateway,
  codepay_wx: epayGateway, // 微信码支付骨架与易支付同构
}

export function getGateway(model: string): PayGateway | undefined {
  return gateways[model]
}

export function getChannelByModel(model: string): Promise<PayChannelInfo | null> {
  return prisma.payChannel
    .findFirst({ where: { model, status: 1 } })
    .then((c) => (c ? { model: c.model, appId: c.appId, appKey: c.appKey, payUrl: c.payUrl } : null))
}

// ---------- 统一落单 confirmPaid ----------

export interface ConfirmResult {
  ok: boolean
  idempotent: boolean
  isKouliang?: 1 | 2
  creditedUid?: number
  orderSn?: string
  msg?: string
}

/**
 * 支付成功唯一入口（幂等，见文档 8.5 / 8.7.7）
 * 事务 + FOR UPDATE 双重保护，防并发重复入账
 */
export async function confirmPaid(orderSn: string): Promise<ConfirmResult> {
  if (!orderSn) return { ok: false, idempotent: false, msg: '订单号为空' }

  // Redis 前置去重锁（30s，防并发回调风暴）
  const lock = await redisSetNX(`pay_done_${orderSn}`, 30)
  if (!lock) {
    // 可能已在处理，再查 DB 状态
    const existing = await prisma.payOrder.findUnique({ where: { transact: orderSn } })
    if (existing?.status === 1) return { ok: true, idempotent: true, orderSn }
    return { ok: false, idempotent: false, msg: '支付处理中，请稍后重试' }
  }

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. 订单行 FOR UPDATE
      const rows = await tx.$queryRaw<Array<Record<string, unknown>>>`
        SELECT * FROM pay_orders WHERE transact = ${orderSn} LIMIT 1 FOR UPDATE`
      const order = rows[0]
      if (!order) throw new Error('订单不存在')
      if (order.status === 1) {
        return {
          idempotent: true,
          isKouliang: (Number(order.isKouliang) === 2 ? 2 : 1) as 1 | 2,
          creditedUid: Number(order.uid),
        }
      }

      // 2. 卖单代理行 FOR UPDATE
      const adminRows = await tx.$queryRaw<Array<Record<string, unknown>>>`
        SELECT * FROM admins WHERE id = ${Number(order.uid)} LIMIT 1 FOR UPDATE`
      const admin = adminRows[0]
      if (!admin) throw new Error('代理不存在')

      // 3. 已支付订单计数（在本单置已支付之前取值——原版口径）
      const paidCount = await tx.payOrder.count({ where: { uid: Number(order.uid), status: 1 } })

      const moneyCents = decimalToCents(order.price)
      const multiLevelEnabled = process.env.MULTI_LEVEL_COMMISSION !== 'false'

      // 4. 扣量 + 分账（事务内锁已持有）
      const settle = await settleOrder(tx, {
        agent: {
          id: Number(admin.id),
          pid: Number(admin.pid),
          pidTop: Number(admin.pidTop),
          username: String(admin.username),
          kouliang: Number(admin.kouliang),
          ticheng: Number(admin.ticheng),
          balance: admin.balance,
        },
        transact: orderSn,
        moneyCents,
        paidCount,
        multiLevelEnabled,
      })

      // 5. 订单置已支付
      const tcMoneyCents = settle.entries.reduce(
        (sum, e) => (e.biz === 'ticheng' ? sum + e.amountCents : sum),
        0,
      )
      await tx.payOrder.update({
        where: { transact: orderSn },
        data: {
          status: 1,
          payTime: new Date(),
          tcMoney: centsToDecimal(tcMoneyCents),
          isKouliang: settle.isKouliang,
        },
      })

      // 6. 写已购权益（扣量单同样照发用户权益）
      const singleExpireDays = Number(process.env.SINGLE_EXPIRE_DAYS || 1)
      await writePayedShow(tx, {
        vid: Number(order.vid),
        uid: Number(order.uid),
        ip: String(order.ip),
        ua: order.ua ? String(order.ua) : null,
        orderSn,
        isDate: Number(order.isDate),
        isWeek: Number(order.isWeek),
        isMonth: Number(order.isMonth),
        singleExpireDays,
      })

      return {
        idempotent: false,
        isKouliang: settle.isKouliang,
        creditedUid: settle.creditedUid,
      }
    },
    { maxWait: 10_000, timeout: 20_000 },
  )

  // 7. 事务外：Redis 当日成交计数
  const date = new Date().toISOString().slice(0, 10)
  if (!result.idempotent) {
    const credited = result.creditedUid ?? Number((await prisma.payOrder.findUnique({ where: { transact: orderSn } }))?.uid)
    if (result.isKouliang === 2) {
      // 扣量单固定记到 uid=1（还原原版）
      await redisZAdd(`success_order_1_${date}`, Date.now(), orderSn)
    } else {
      await redisZAdd(`success_order_${credited}_${date}`, Date.now(), orderSn)
    }
  }

  return { ok: true, ...result, orderSn }
}
