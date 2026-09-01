import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { getRealIp } from '../../utils/ip'
import { readIdentity } from '../../services/fingerprint.service'
import { getEntitlement } from '../../services/h5.service'
import { isAllAccess } from '../../services/entitlement.service'
import { getLandingUrl } from '../../services/domain.service'
import { obfuscate } from '../../utils/obfuscate'

/**
 * 视频播放/权益校验（还原 Index::video，见文档 8.7④）
 * 入参：vid 必填；f 必填；encode=0 兼容混淆
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const vid = Number(q.vid || 0)
  const f = String(q.f || '')
  const encode = String(q.encode ?? '1')

  if (!vid) {
    return { code: 0, data: [], msg: '视频资源丢失!' }
  }

  const link = await prisma.stock.findUnique({ where: { id: vid } })
  if (!link) {
    return { code: 0, data: [], msg: '视频资源丢失!' }
  }

  const ip = getRealIp(event)
  const identity = readIdentity(event, ip)
  // 携单号找回（is_sn=1）：用订单记录的 IP 作为可信来源，允许换网络续播
  const cookies = parseCookies(event)
  const sn = cookies.is_sn === '1' && cookies.sn ? cookies.sn : undefined
  const entitlement = await getEntitlement(event, ip, identity.fp || identity.uaMd5, sn)

  const payedSet = new Set(entitlement.vid)
  const desc = entitlement.isMonth === 2 ? '包月' : entitlement.isWeek === 2 ? '包周' : entitlement.isDate === 2 ? '包天' : '单片'
  const allAccess = isAllAccess(entitlement)

  // 单部校验：vid 命中 + 该条 payed_shows 中 ip/ua 任一匹配且未过期
  let payed = false
  if (payedSet.has(vid)) {
    const hit = await prisma.payedShow.findFirst({
      where: {
        vid,
        expire: { gt: new Date() },
        OR: [
          { ip },
          ...(identity.fp ? [{ ua: identity.fp }] : []),
          ...(identity.uaMd5 && !identity.fp ? [{ ua: identity.uaMd5 }] : []),
        ],
      },
    })
    if (hit) payed = true
  }
  if (allAccess) payed = true

  if (!payed) {
    return { code: 0, data: [], msg: '视频不存在!或者已过期!' }
  }

  // 找回链接：入口域名(type=1) + /?sn={orderSn}&f={f}
  let recoverUrl = ''
  if (entitlement.sn) {
    const entryDomain = await getLandingUrl(0, 1).catch(() => '')
    if (entryDomain) {
      recoverUrl = `http://${entryDomain}/?sn=${entitlement.sn}&f=${f}`
    }
  }

  const payload = {
    payed,
    link: { url: link.url, img: link.img, title: link.title },
  }

  if (encode === '0') {
    return { code: 1, msg: 'success', data: { data: obfuscate(payload) } }
  }

  return {
    code: 1,
    msg: 'success',
    data: {
      ...payload,
      desc,
      expire: entitlement.expire ? formatDate(entitlement.expire) : '',
      recoverUrl,
    },
  }
})

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
