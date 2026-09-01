import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { getRealIp, getUa } from '../../utils/ip'
import { detectDevice } from '../../utils/device'
import { decodeId } from '../../utils/hashids'

/**
 * 访客上报（🔵 新增，见文档 6.1）
 * POST body: { f?, referer? }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const ip = getRealIp(event)
  const ua = getUa(event)
  const f = body.f ? decodeId(String(body.f)) : 0
  const referer = String(body.referer || '').slice(0, 255)

  await prisma.visitorTrack
    .create({
      data: {
        ip,
        ua: ua.slice(0, 512),
        deviceType: detectDevice(ua),
        f,
        referer,
        blocked: 0,
      },
    })
    .catch(() => {})

  return { code: 1, msg: 'success', data: null }
})
