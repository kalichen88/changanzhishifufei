/** 本地生成推广二维码/短链用随机串 */
export function strRand(len = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  const arr = new Uint32Array(len)
  globalThis.crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) {
    out += chars[arr[i] % chars.length]
  }
  return out
}
