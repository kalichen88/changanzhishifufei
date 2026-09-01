import { defineEventHandler } from 'h3'
import { getRealIp } from '../utils/ip'
import { detectDevice } from '../utils/device'
import { ensureFingerprint } from '../services/fingerprint.service'
import { decodeId } from '../utils/hashids'
import { prisma } from '../utils/prisma'

/**
 * 访客指纹 Cookie + 访问记录（见文档 8.4 / 20. visitor_tracks）
 * 对 H5 页面与 H5 API 生效：保证 __fp / ua_md5 身份稳定，并落访客轨迹
 */
export default defineEventHandler(async (event) => {
  const url = event.path || ''
  const isH5Page = url.startsWith('/list') || url.startsWith('/cat') || url.startsWith('/search') ||
    url.startsWith('/v/') || url.startsWith('/buy') || url.startsWith('/about') || url.startsWith('/t') ||
    url.startsWith('/l') || url === '/' 
  const isH5Api = url.startsWith('/api/h5')
  if (!isH5Page && !isH5Api) return

  const ip = getRealIp(event)
  const ua = getRequestHeaders(event)['user-agent'] || ''
  const deviceType = detectDevice(ua)

  // 确保指纹 Cookie（HttpOnly）
  await ensureFingerprint(event, ip).catch(() => {})

  // 访客轨迹（仅入口/页面级，避免高频 API 撑爆表）
  if (isH5Api && url.includes('/entry')) {
    const fParam = getQuery(event).f
    const f = typeof fParam === 'string' && fParam ? decodeId(fParam) : 0
    await prisma.visitorTrack
      .create({
        data: {
          ip,
          ua: ua.slice(0, 512),
          deviceType,
          fpId: null,
          f,
          blocked: 0,
          referer: (getRequestHeaders(event)['referer'] || '').slice(0, 255),
        },
      })
      .catch(() => {})
  }
})
