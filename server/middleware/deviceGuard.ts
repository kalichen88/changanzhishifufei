import { defineEventHandler } from 'h3'
import { detectDevice, detectBuiltinBrowser } from '../utils/device'
import { getRealIp, getUa } from '../utils/ip'
import { getConfigBool } from '../utils/config'
import { decodeId } from '../utils/hashids'
import { prisma } from '../utils/prisma'

/**
 * 设备 / IP 识别 + 屏蔽 PC + 防封提示（见文档 8.3）
 * 仅对 H5 前台生效；后台 /admin、/agent 及静态资源放行
 */
export default defineEventHandler(async (event) => {
  const url = event.path || ''

  // 放行：静态资源 / 后台 / API 后台
  if (
    url.startsWith('/_nuxt') ||
    url.startsWith('/_ipx') ||
    url.startsWith('/favicon') ||
    url.startsWith('/assets') ||
    url.startsWith('/admin') ||
    url.startsWith('/agent') ||
    url.startsWith('/api/admin') ||
    url.startsWith('/api/agent') ||
    url.startsWith('/api/pay') ||
    url.startsWith('/.env') ||
    url === '/health'
  ) {
    return
  }

  const ua = getUa(event)
  const ip = getRealIp(event)
  const device = detectDevice(ua)

  // 防封提示（微信/QQ/抖音内置浏览器 → 图片警示页，还原原版 fangfeng）
  const builtin = detectBuiltinBrowser(ua)
  const blockWechat = await getConfigBool('isWechat')
  const blockQQ = await getConfigBool('isQQ')
  const blockDouyin = await getConfigBool('isDouyin')
  if (
    (builtin === 'wechat' && blockWechat) ||
    (builtin === 'qq' && blockQQ) ||
    (builtin === 'douyin' && blockDouyin)
  ) {
    const img = builtin === 'wechat' ? 'wechat.jpg' : builtin === 'qq' ? 'qq.jpg' : 'douyin.jpg'
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><img src="/img/${img}" style="width:100vw;height:100vh;object-fit:contain"></body></html>`
  }

  const blockPc = process.env.DEVICE_BLOCK_PC !== 'false'
  const allowTablet = process.env.DEVICE_ALLOW_TABLET !== 'false'
  const isMobileLike = device === 'mobile' || (device === 'tablet' && allowTablet)

  // f 参数 → 推广代理
  let f = 0
  const fParam = getQuery(event).f
  if (typeof fParam === 'string' && fParam) {
    f = decodeId(fParam)
  }

  if (!isMobileLike && blockPc) {
    // 记录拦截
    await prisma.visitorTrack
      .create({
        data: {
          ip,
          ua: ua.slice(0, 512),
          deviceType: device,
          f,
          blocked: 1,
          referer: (getRequestHeaders(event)['referer'] || '').slice(0, 255),
        },
      })
      .catch(() => {})
    setResponseStatus(event, 403)
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>提示</title></head><body style="margin:0;font-family:system-ui"><div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f7f8fa;color:#323233;text-align:center;padding:24px"><div style="font-size:64px">📱</div><h2 style="margin:16px 0 8px">请使用手机访问</h2><p style="color:#969799;font-size:14px;margin:0">本内容仅支持在手机端观看<br>请用手机浏览器扫描推广二维码进入</p></div></body></html>`
  }

  return
})
