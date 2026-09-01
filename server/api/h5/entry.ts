import { defineEventHandler } from 'h3'
import { getRealIp, getUa } from '../../utils/ip'
import { prisma } from '../../utils/prisma'
import { resolveAgent } from '../../services/h5.service'
import { ensureFingerprint } from '../../services/fingerprint.service'
import { countAccess } from '../../services/stats.service'

/**
 * 入口（还原 Index::index，见文档 8.7）
 * - 解析 f → 代理；代理被禁用 → 报错
 * - sn 找回：命中写 sn/is_sn cookie；未命中清 is_sn
 * - 写指纹 Cookie + 访问计数
 * - 返回落地跳转信息
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const f = String(q.f || '')
  const sn = String(q.sn || '')
  const ip = getRealIp(event)

  const agent = await resolveAgent(f)
  if (!agent) {
    setResponseStatus(event, 400)
    return { code: 0, msg: '推广链接无效', data: null }
  }
  if (agent.status !== 'normal') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '该用户已经被禁用!', data: null }
  }

  // sn 找回（已购跨设备续播）
  if (sn) {
    const order = await prisma.payedShow.findFirst({
      where: { orderSn: sn, expire: { gt: new Date() } },
    })
    if (order) {
      setCookie(event, 'sn', sn, { httpOnly: true, maxAge: 3600, path: '/' })
      setCookie(event, 'is_sn', '1', { httpOnly: true, maxAge: 3600, path: '/' })
    } else {
      setCookie(event, 'is_sn', '0', { httpOnly: true, maxAge: 3600, path: '/' })
      setCookie(event, 'sn', '', { httpOnly: true, maxAge: 0, path: '/' })
    }
  }

  // 指纹 Cookie
  await ensureFingerprint(event, ip).catch(() => {})

  // 访问计数（仅入口）
  await countAccess(agent.id, ip)

  const ua = getUa(event)
  void ua

  return {
    code: 1,
    msg: 'success',
    data: {
      uid: agent.id,
      f,
      redirect: `/l?f=${f}`,
      nickname: agent.nickname,
    },
  }
})
