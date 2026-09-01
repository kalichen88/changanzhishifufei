import { describe, it, expect } from 'vitest'
import { judgeKouliang, type SettlementInput } from '../server/services/kouliang.service'

const agent = (partial: Partial<SettlementInput['agent']> = {}): SettlementInput['agent'] => ({
  id: 2,
  pid: 1,
  pidTop: 1,
  username: 'B',
  kouliang: 5,
  ticheng: 10,
  balance: '0.00',
  ...partial,
})

describe('扣量判定（8.1）', () => {
  it('kouliang=5、已有4单（count=4）→ 不扣', () => {
    expect(judgeKouliang(agent(), 4)).toBe(1)
  })

  it('kouliang=5、已有5单（count=5）→ 扣量', () => {
    expect(judgeKouliang(agent(), 5)).toBe(2)
  })

  it('count=10（第11单，10%5=0）→ 扣量', () => {
    expect(judgeKouliang(agent(), 10)).toBe(2)
  })

  it('count=0（首单）→ 永不扣', () => {
    expect(judgeKouliang(agent(), 0)).toBe(1)
  })

  it('kouliang=0 → 永不扣', () => {
    expect(judgeKouliang(agent({ kouliang: 0 }), 5)).toBe(1)
  })

  it('pid=0（顶级）→ 永不扣', () => {
    expect(judgeKouliang(agent({ pid: 0, pidTop: 0 }), 5)).toBe(1)
  })
})
