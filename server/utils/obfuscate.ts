/**
 * 兼容旧版客户端的混淆编码（见文档 8.7）
 * 新版 H5 全走明文；仅在显式传 encode=0 时启用
 */

export function strrev(s: string): string {
  return s.split('').reverse().join('')
}

/** vlist/video 的 strrev(base64(json)) 混淆 */
export function obfuscate(obj: unknown): string {
  const b64 = Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64')
  return strrev(b64)
}

/** cat 的 base64(json) → strrev → 去 '=' */
export function obfuscateCat(obj: unknown): string {
  const b64 = Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64')
  return strrev(b64).replace(/==/g, '').replace(/=/g, '')
}
