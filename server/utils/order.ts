/**
 * 订单号生成（还原原版：date("YmdHis") + rand(10000,99999)）
 */
import { createHash } from 'node:crypto'

export function genTransact(): string {
  const d = new Date()
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  const ymdhis =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  const rand = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000
  return `${ymdhis}${rand}`
}

/** 服务端生成稳定指纹ID */
export function genFingerprintId(): string {
  const crypto = globalThis.crypto
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function md5Hex(input: string): string {
  return createHash('md5').update(input).digest('hex')
}
