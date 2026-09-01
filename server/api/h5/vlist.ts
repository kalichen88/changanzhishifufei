import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { obfuscate } from '../../utils/obfuscate'
import { getRealIp } from '../../utils/ip'
import { readIdentity } from '../../services/fingerprint.service'
import { resolveAgent, getEntitlement } from '../../services/h5.service'
import { getLandingUrl } from '../../services/domain.service'
import { isAllAccess } from '../../services/entitlement.service'
import { getConfigInt } from '../../utils/config'

/**
 * 视频列表（还原 Index::vlist，见文档 8.7①）
 * 入参：f / key / cid / payed / limit / page / encode / random
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const f = String(q.f || '')
  const key = String(q.key || '').trim()
  const cid = Number(q.cid || 0)
  const payed = String(q.payed || '')
  const limit = Math.min(Math.max(Number(q.limit) || 10, 1), 100)
  const page = Math.max(Number(q.page) || 1, 1)
  const encode = String(q.encode ?? '1')
  const random = String(q.random || '') === '1'

  const agent = await resolveAgent(f)
  if (!agent) {
    setResponseStatus(event, 400)
    return { code: 0, status: 0, msg: '推广链接无效', total: 0, data: [] }
  }

  const ip = getRealIp(event)
  const identity = readIdentity(event, ip)
  // 携单号找回（is_sn=1）：用订单记录的 IP 作为可信来源，允许换网络续播
  const cookies = parseCookies(event)
  const sn = cookies.is_sn === '1' && cookies.sn ? cookies.sn : undefined
  const entitlement = await getEntitlement(event, ip, identity.fp || identity.uaMd5, sn)
  const allAccess = isAllAccess(entitlement)

  // 落地域名（type=2）；支付域名（type=3，无则回落 2）
  const landing = await getLandingUrl(agent.id, 2)
  const payDomain = await getLandingUrl(agent.id, 3)

  // 过滤条件（还原原版语义：cid → 用分类名 like 标题）
  const titleLikes: Array<{ contains: string }> = []
  if (key) titleLikes.push({ contains: key })
  if (cid) {
    const cat = await prisma.category.findUnique({ where: { id: cid } })
    if (cat?.name) titleLikes.push({ contains: cat.name })
  }

  const where: any = { status: 1 }
  if (titleLikes.length) where.title = { contains: titleLikes[0].contains }

  // 已购过滤：payed=1 且无任何包时段有效 → 只返回已购视频
  if (payed === '1' && !allAccess) {
    where.id = { in: entitlement.vid }
  }

  const [total, stocks] = await Promise.all([
    prisma.stock.count({ where }),
    prisma.stock.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: random ? [{ id: 'desc' }] : [{ id: 'desc' }],
      select: {
        id: true, cid: true, title: true, img: true, url: true,
      },
    }),
  ])

  // 代理独立定价批量取
  const ids = stocks.map((s) => s.id)
  const prices = ids.length
    ? await prisma.stockPrice.findMany({ where: { uid: agent.id, stockId: { in: ids } } })
    : []
  const priceMap = new Map(prices.map((p) => [p.stockId, p.price]))
  const globalPrice = await getConfigInt('price')
  const payedSet = new Set(entitlement.vid)

  const list = stocks.map((s) => {
    const sp = priceMap.get(s.id)
    const money = sp && Number(sp) > 0 ? Number(sp) : globalPrice
    const isPayed = payedSet.has(s.id) || allAccess
    return {
      id: s.id,
      cid: s.cid,
      title: s.title,
      img: s.img,
      url: isPayed
        ? `http://${landing}/api/h5/video?vid=${s.id}&f=${f}`
        : `http://${payDomain || landing}/api/h5/pay/options?vid=${s.id}&f=${f}`,
      vid_url: isPayed ? s.url : '', // 已购才下发音源，未购不外泄
      money,
      rand: Math.floor(Math.random() * (7777 - 999 + 1)) + 999,
      read_num: Math.floor(Math.random() * (7777 - 999 + 1)) + 999,
      h: Math.floor(Math.random() * (99 - 90 + 1)) + 90,
      pay: isPayed ? 1 : 0,
    }
  })

  // 还原原版：shuffle 三次
  for (let i = 0; i < 3; i++) {
    for (let j = list.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[list[j], list[k]] = [list[k], list[j]]
    }
  }

  if (encode === '0') {
    return { status: 1, msg: '', total, data: obfuscate(list) }
  }
  return { code: 1, status: 1, msg: 'success', total, data: list }
})
