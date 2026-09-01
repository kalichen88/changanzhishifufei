import type { H3Event } from 'h3'
import { prisma } from '../utils/prisma'
import { getUa } from '../utils/ip'
import { genFingerprintId, md5Hex } from '../utils/order'

/**
 * 服务端稳定浏览器指纹（见文档 8.4 身份方案）
 *
 * - __fp：服务端生成随机 64 位十六进制，HttpOnly 写入 Cookie
 * - ua_md5：md5(UA) 兜底（对应原版 cookie('ua')）
 * 判定优先级：__fp 命中 > ua_md5 命中 > ip 命中
 */
export const FP_COOKIE = '__fp'
export const UA_COOKIE = 'ua_md5'

export interface VisitorIdentity {
  fp: string | null
  uaMd5: string
  ua: string
  ip: string
}

function readCookie(event: H3Event, name: string): string | null {
  const cookies = parseCookies(event)
  return cookies[name] || null
}

/**
 * 读取（必要时生成）访客指纹并写入 HttpOnly Cookie
 * 每次请求由中间件调用，保证身份稳定
 */
export async function ensureFingerprint(
  event: H3Event,
  ip: string,
): Promise<{ fp: string; uaMd5: string }> {
  const ua = getUa(event)
  const uaMd5 = md5Hex(ua)

  let fp = readCookie(event, FP_COOKIE)
  if (fp && /^[0-9a-f]{32,64}$/.test(fp)) {
    // 已存在且格式合法 → 仅写 ua_md5 兜底 cookie
    setCookie(event, UA_COOKIE, uaMd5, { httpOnly: true, maxAge: 7 * 86400, path: '/' })
    return { fp, uaMd5 }
  }

  // 不存在 → 生成新指纹并入库
  fp = genFingerprintId()
  await prisma.deviceFingerprint
    .create({
      data: {
        id: fp,
        uaMd5,
        ua: ua.slice(0, 512),
        firstIp: ip,
        lastIp: ip,
      },
    })
    .catch(() => {
      /* 并发幂等：已存在则忽略 */
    })

  setCookie(event, FP_COOKIE, fp, { httpOnly: true, maxAge: 3650 * 86400, path: '/' })
  setCookie(event, UA_COOKIE, uaMd5, { httpOnly: true, maxAge: 7 * 86400, path: '/' })
  return { fp, uaMd5 }
}

/** 只读取不生成（用于无需写 cookie 的查询场景） */
export function readIdentity(event: H3Event, ip: string): VisitorIdentity {
  const ua = getUa(event)
  const fp = readCookie(event, FP_COOKIE)
  return { fp, uaMd5: md5Hex(ua), ua, ip }
}
