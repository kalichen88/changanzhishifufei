import type { H3Event } from 'h3'
import { prisma } from '../utils/prisma'
import { decodeId } from '../utils/hashids'
import { getRealIp } from '../utils/ip'
import { readIdentity } from './fingerprint.service'
import { getPayedVideos, isAllAccess } from './entitlement.service'
import { getLandingUrl } from './domain.service'
import { getConfigInt } from '../utils/config'
import { absUrl } from '../utils/site'

/**
 * H5 匿名接口公共逻辑（见文档 8.7）
 */

export interface ResolvedVisitor {
  /** 卖单代理 */
  agent: {
    id: number
    pid: number
    pidTop: number
    username: string
    nickname: string
    kouliang: number
    ticheng: number
    balance: unknown
    viewId: number
    dateFee: number
    weekFee: number
    monthFee: number
    bt: number
    by: number
    payModel: string
    payModel1: string | null
    wxCheckApi: string | null
    txImg: string | null
    status: string
  }
  f: string
  uid: number
  ip: string
  ua: string | null
}

/** 解析 f → 代理；非法返回 null */
export async function resolveAgent(
  f: string,
): Promise<ResolvedVisitor['agent'] | null> {
  if (!f) return null
  const uid = decodeId(f)
  if (!uid) return null
  const agent = await prisma.admin.findUnique({
    where: { id: uid },
    select: {
      id: true, pid: true, pidTop: true, username: true, nickname: true,
      kouliang: true, ticheng: true, balance: true, viewId: true,
      dateFee: true, weekFee: true, monthFee: true, bt: true, by: true,
      payModel: true, payModel1: true, wxCheckApi: true, txImg: true, status: true,
    },
  })
  return agent
}

/** 组装访客上下文 */
export async function buildVisitor(event: H3Event, f: string): Promise<ResolvedVisitor | null> {
  const agent = await resolveAgent(f)
  if (!agent) return null
  const ip = getRealIp(event)
  const identity = readIdentity(event, ip)
  return {
    agent,
    f,
    uid: agent.id,
    ip,
    ua: identity.fp || identity.uaMd5,
  }
}

/** 权益快照（IP/指纹，携 sn 时用订单 IP） */
export async function getEntitlement(
  event: H3Event,
  ip: string,
  ua: string | null,
  sn?: string | null,
): Promise<Awaited<ReturnType<typeof getPayedVideos>>> {
  let trustIp: string | undefined
  if (sn) {
    const show = await prisma.payedShow.findFirst({ where: { orderSn: sn, expire: { gt: new Date() } } })
    if (show?.ip) trustIp = show.ip
  }
  return getPayedVideos(prisma, { ip, ua, trustIp })
}

/** 全局单片价 */
export async function getGlobalPrice(): Promise<number> {
  return getConfigInt('price')
}

/** 代理实际单片价（独立定价覆盖全局价） */
export async function getStockPrice(uid: number, vid: number): Promise<number> {
  const sp = await prisma.stockPrice.findUnique({ where: { uid_stockId: { uid, stockId: vid } } })
  if (sp && Number(sp.price) > 0) return Number(sp.price)
  return getGlobalPrice()
}

/** 落地域名 + 路径，构造推广链接（还原原版） */
export async function buildPromoUrl(uid: number, path = '/t'): Promise<string> {
  const { getPushUrl } = await import('./domain.service')
  const domain = await getPushUrl(uid)
  const { encodeId } = await import('../utils/hashids')
  return absUrl(domain, `${path}?f=${encodeId(uid)}`)
}

export function isAgentNormal(agent: ResolvedVisitor['agent']): boolean {
  return agent.status === 'normal'
}

export { isAllAccess }
