import { defineEventHandler, getQuery, setResponseHeader, setResponseStatus } from 'h3'
import { lookup } from 'node:dns/promises'

/**
 * 媒体外链代理（GET /api/h5/proxy?u=<外链>）
 *
 * 职责：
 *  1. 把外部 http 封面/视频/m3u8 通过本站 https 回传，解决 HTTPS 页面 mixed content 拦截；
 *  2. m3u8 播放列表内部分片/密钥/嵌套列表统一重写为本代理地址，
 *     使 hls.js 全程同源请求，规避 CORS 与 AES-128 key 的加载限制；
 *  3. 安全：SSRF 防护——仅允许公网 http/https，禁私网/回环/保留地址，端口白名单。
 */

// 常见 Web/媒体端口（其余一律拒绝，降低 SSRF 面）
const ALLOWED_PORTS = new Set([80, 443, 8080, 8000, 8443, 8888, 9000, 3000, 3001, 5000, 5173])
const MAX_REDIRECTS = 5
const MAX_BODY = 256 * 1024 * 1024 // 二进制上限 256MB（防滥用）

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase().replace(/^\[|\]$/g, '')
    if (lower === '::1' || lower === '::') return true
    if (lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true
    return false
  }
  const p = ip.split('.').map((x) => Number(x))
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true
  const [a, b] = p
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true // link-local
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a >= 224) return true // 组播/保留
  return false
}

async function isSafeHost(hostname: string): Promise<boolean> {
  if (!hostname || /^localhost(\.localdomain)?$/i.test(hostname)) return false
  // IP 字面量
  if (/^\[?[\d:.a-fA-F]+\]?$/.test(hostname)) {
    return !isPrivateIp(hostname.replace(/^\[|\]$/g, ''))
  }
  try {
    const addrs = await lookup(hostname, { all: true })
    if (!addrs.length) return false
    return addrs.every((a) => !isPrivateIp(a.address))
  } catch {
    return false
  }
}

function assertUrl(u: string): { ok: true; value: URL } | { ok: false; reason: string } {
  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    return { ok: false, reason: 'invalid_url' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'scheme_forbidden' }
  }
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80
  if (!ALLOWED_PORTS.has(port)) {
    return { ok: false, reason: 'port_forbidden' }
  }
  return { ok: true, value: parsed }
}

/** 把绝对地址转为本代理同源地址 */
function proxyUri(abs: string): string {
  return `/api/h5/proxy?u=${encodeURIComponent(abs)}`
}

/** 重写 m3u8：分片 URI + EXT-X-KEY/EXT-X-MAP 的密钥 URI 全部走代理 */
function rewritePlaylist(text: string, base: string): string {
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line || line.startsWith('#')) {
      if (/^#EXT-X-KEY:/.test(line) || /^#EXT-X-MAP:/.test(line)) {
        lines[i] = raw.replace(/URI="([^"]*)"/gi, (_all, uri: string) => {
          try {
            return `URI="${proxyUri(new URL(uri, base).toString())}"`
          } catch {
            return `URI="${proxyUri(uri)}"`
          }
        })
      }
      continue
    }
    // URI 行：可能是相对路径/绝对路径/纯 query
    try {
      lines[i] = proxyUri(new URL(line, base).toString())
    } catch {
      /* 保留原样 */
    }
  }
  return lines.join('\n')
}

/**
 * 二进制内容类型判定：优先魔法字节，其次 URL 扩展名，最后上游头。
 * 部分 CDN 会把 jpg/gif/ts 误标为 text/plain，直接透传会导致浏览器/播放器不识别。
 */
function detectBinaryType(url: string, upstreamType: string, buf: Uint8Array): string {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif' // GIF8
    if (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) {
      return 'image/webp' // RIFF....WEBP
    }
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x00 && buf[3] === 0x18 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
      return 'video/mp4' // ftyp
    }
  }
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg'
  if (clean.endsWith('.png')) return 'image/png'
  if (clean.endsWith('.gif')) return 'image/gif'
  if (clean.endsWith('.webp')) return 'image/webp'
  if (clean.endsWith('.mp4') || clean.endsWith('.m4s')) return 'video/mp4'
  if (clean.endsWith('.ts')) return 'video/mp2t'
  if (clean.endsWith('.key') || clean.endsWith('.key2')) return 'application/octet-stream'
  if (upstreamType && !/text\/plain|application\/octet-stream/i.test(upstreamType)) return upstreamType
  return 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const raw = typeof q.u === 'string' ? q.u : ''
  if (!raw) {
    setResponseStatus(event, 400)
    return { code: 0, msg: '缺少资源地址' }
  }

  const first = assertUrl(raw)
  if (!first.ok) {
    setResponseStatus(event, first.reason === 'scheme_forbidden' ? 400 : 403)
    return { code: 0, msg: first.reason }
  }

  let current = raw
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const check = assertUrl(current)
    if (!check.ok) {
      setResponseStatus(event, 403)
      return { code: 0, msg: check.reason }
    }
    if (!(await isSafeHost(check.value.hostname))) {
      setResponseStatus(event, 403)
      return { code: 0, msg: 'target_forbidden' }
    }

    const origin = check.value.origin
    const res = await fetch(current, {
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        Referer: `${origin}/`,
        Accept: '*/*',
      },
    }).catch(() => null)
    if (!res) {
      setResponseStatus(event, 502)
      return { code: 0, msg: 'upstream_unreachable' }
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) {
        setResponseStatus(event, 502)
        return { code: 0, msg: 'redirect_missing' }
      }
      current = new URL(loc, current).toString()
      continue
    }
    if (res.status === 404) {
      setResponseStatus(event, 404)
      return { code: 0, msg: 'resource_not_found' }
    }
    if (res.status >= 400) {
      setResponseStatus(event, 502)
      return { code: 0, msg: `upstream_error_${res.status}` }
    }

    const type = res.headers.get('content-type') || ''
    const isPlaylist = /mpegurl|vnd\.apple\.mpegurl|application\/vnd\.apple/i.test(type)

    // —— m3u8 播放列表：读文本 → 重写分片/密钥地址 ——
    if (isPlaylist) {
      const text = await res.text()
      const out = rewritePlaylist(text, current)
      setResponseHeader(event, 'Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8')
      setResponseHeader(event, 'Cache-Control', 'no-cache')
      setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
      return out
    }

    // —— 二进制直通（封面 jpg/gif、ts 分片、AES key、mp4 等）——
    const cl = res.headers.get('content-length')
    if (cl && Number(cl) > MAX_BODY) {
      setResponseStatus(event, 413)
      return { code: 0, msg: 'body_too_large' }
    }
    const buf = await res.arrayBuffer().catch(() => null)
    if (!buf) {
      setResponseStatus(event, 502)
      return { code: 0, msg: 'upstream_read_failed' }
    }
    if (buf.byteLength > MAX_BODY) {
      setResponseStatus(event, 413)
      return { code: 0, msg: 'body_too_large' }
    }
    const bytes = new Uint8Array(buf)
    setResponseHeader(event, 'Content-Type', detectBinaryType(current, type, bytes))
    setResponseHeader(event, 'Content-Length', String(buf.byteLength))
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    return bytes
  }

  setResponseStatus(event, 502)
  return { code: 0, msg: 'too_many_redirects' }
})
