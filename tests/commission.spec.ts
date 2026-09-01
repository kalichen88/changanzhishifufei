import { describe, it, expect } from 'vitest'
import { computeMultiLevelCommission, type ChainNode } from '../server/services/commission.service'

const node = (id: number, pid: number, username: string, ticheng: number): ChainNode => ({
  id,
  pid,
  username,
  ticheng,
})

describe('多级分账瀑布算法（8.1，合计恒等 100%）', () => {
  it('倒挂链：B(10)→A(20)→admin(0)，订单5元 → 90%+0%+10%', () => {
    const chain = [node(2, 3, 'B', 10), node(3, 1, 'A', 20), node(1, 0, 'admin', 0)]
    const entries = computeMultiLevelCommission(chain, 500, 'T1')
    const sum = entries.reduce((s, e) => s + e.amountCents, 0)
    expect(sum).toBe(500)
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uid: 2, amountCents: 450, biz: 'income' }),
        expect.objectContaining({ uid: 1, amountCents: 50, biz: 'ticheng' }),
      ]),
    )
    // A（倒挂层）不截留
    expect(entries.find((e) => e.uid === 3)).toBeUndefined()
  })

  it('正常渐进链：C(20)→B(10)→admin(0)，订单10元 → 80%+10%+10%', () => {
    const chain = [node(4, 3, 'C', 20), node(3, 1, 'B', 10), node(1, 0, 'admin', 0)]
    const entries = computeMultiLevelCommission(chain, 1000, 'T2')
    expect(entries.reduce((s, e) => s + e.amountCents, 0)).toBe(1000)
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uid: 4, amountCents: 800 }),
        expect.objectContaining({ uid: 3, amountCents: 100 }),
        expect.objectContaining({ uid: 1, amountCents: 100 }),
      ]),
    )
  })

  it('文档倒挂示例：C(20)→B(30)→admin(0) → 80%+0%+20%', () => {
    const chain = [node(4, 3, 'C', 20), node(3, 1, 'B', 30), node(1, 0, 'admin', 0)]
    const entries = computeMultiLevelCommission(chain, 800, 'T3')
    expect(entries.reduce((s, e) => s + e.amountCents, 0)).toBe(800)
    expect(entries.find((e) => e.uid === 3)).toBeUndefined()
    expect(entries.find((e) => e.uid === 1)?.amountCents).toBe(160)
  })

  it('顶级直卖（单节点，无上流）→ 全额入账', () => {
    const chain = [node(1, 0, 'admin', 0)]
    const entries = computeMultiLevelCommission(chain, 10000, 'T4')
    expect(entries).toEqual([expect.objectContaining({ uid: 1, amountCents: 10000, biz: 'income' })])
  })

  it('四级链合计恒等 100%', () => {
    const chain = [node(5, 4, 'D', 40), node(4, 3, 'C', 30), node(3, 1, 'B', 20), node(1, 0, 'A', 0)]
    const entries = computeMultiLevelCommission(chain, 333, 'T5')
    expect(entries.reduce((s, e) => s + e.amountCents, 0)).toBe(333)
  })

  it('moneyCents<=0 或空链 → 空', () => {
    expect(computeMultiLevelCommission([], 100, 'T6')).toEqual([])
    expect(computeMultiLevelCommission([node(1, 0, 'admin', 0)], 0, 'T7')).toEqual([])
  })

  it('selling ticheng=100（全上交）→ selling 0，上级全收', () => {
    const chain = [node(4, 1, 'C', 100), node(1, 0, 'admin', 0)]
    const entries = computeMultiLevelCommission(chain, 500, 'T8')
    expect(entries).toEqual([expect.objectContaining({ uid: 1, amountCents: 500, biz: 'ticheng' })])
  })
})
