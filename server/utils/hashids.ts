import Hashids from 'hashids'

let _hashids: Hashids | null = null
let _hashids25: Hashids | null = null

function salt(): string {
  return process.env.HASHIDS_SALT || 'changan-default-salt-2026'
}

// 推广链 f 参数：min_length=4（还原原版）
export function getHashids(): Hashids {
  if (!_hashids) {
    _hashids = new Hashids(salt(), Number(process.env.HASHIDS_MIN_LENGTH || 4))
  }
  return _hashids
}

// 支付回调 transact：min_length=25（还原原版 getCallbackUrl）
export function getHashids25(): Hashids {
  if (!_hashids25) {
    _hashids25 = new Hashids(salt(), 25)
  }
  return _hashids25
}

export function encodeId(id: number | string): string {
  return getHashids().encode(id as any)
}

export function decodeId(encoded: string): number {
  const arr = getHashids().decode(encoded)
  if (!arr || arr.length === 0) return 0
  return Number(arr[0])
}

/**
 * 订单号 hashids 编码（min_length=25，还原原版 getCallbackUrl）
 * 订单号为 18 位数字串（如 20260901143025012345），超出 JS Number 安全范围，
 * 必须按字符串传给 hashids（内部用 BigInt 数学），避免精度丢失。
 */
export function encodeTransact(transact: string): string {
  return getHashids25().encode(transact as any)
}

/** 解码回订单号（返回字符串，兼容 BigInt） */
export function decodeTransact(encoded: string): string {
  const arr = getHashids25().decode(encoded)
  if (!arr || arr.length === 0) return ''
  const v = arr[0]
  return typeof v === 'bigint' ? v.toString() : String(v)
}
