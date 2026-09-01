import { describe, it, expect } from 'vitest'
import { decimalToCents, centsToDecimal, toCents, fromCents, percentOf } from '../server/utils/money'

describe('金额工具（整数分运算）', () => {
  it('decimalToCents / centsToDecimal 往返', () => {
    for (const s of ['0', '0.01', '0.10', '1.00', '12.34', '100.00', '9999.99', '0.99']) {
      expect(Number(centsToDecimal(decimalToCents(s)))).toBe(Number(s))
      expect(centsToDecimal(decimalToCents(s))).toMatch(/^\d+\.\d{2}$/)
    }
    expect(decimalToCents('5')).toBe(500)
    expect(decimalToCents(null)).toBe(0)
    expect(decimalToCents(undefined)).toBe(0)
  })

  it('toCents / fromCents 边界', () => {
    expect(toCents('3.145')).toBe(314) // 截断到分，不四舍五入
    expect(toCents('0.005')).toBe(0)
    expect(fromCents(0)).toBe('0.00')
    expect(fromCents(1)).toBe('0.01')
    expect(fromCents(1000)).toBe('10.00')
  })

  it('percentOf 向下取整', () => {
    expect(percentOf(1000, 10)).toBe(100)
    expect(percentOf(500, 10)).toBe(50)
    expect(percentOf(333, 33)).toBe(109) // 333*33/100=109.89 → 109
    expect(percentOf(1000, 0)).toBe(0)
    expect(percentOf(1000, 100)).toBe(1000)
  })
})
