/**
 * 金额工具：Decimal 字符串安全运算
 * 全部金额在服务端用字符串/整数（分）运算，避免浮点误差
 */

// Prisma Decimal（Decimal.js 对象）转整数分
export function decimalToCents(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return toCents(String(value))
  // Decimal.js 对象 / 字符串 / bigint
  return toCents(String(value))
}

// 整数分 → Decimal 字符串（"12.34"），供 Prisma Decimal 字段写入
export function centsToDecimal(cents: number): string {
  return fromCents(cents)
}
export function toCents(amount: string | number | { toString(): string }): number {
  const s = String(amount)
  const [int, frac = ''] = s.split('.')
  const fracPadded = (frac + '00').slice(0, 2)
  return Number(int) * 100 + Number(fracPadded)
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export function percentOf(cents: number, percent: number): number {
  // percent 为整数（0-100）
  return Math.floor((cents * percent) / 100)
}
