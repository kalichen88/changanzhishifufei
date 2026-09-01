import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAllAccess, getPayedVideos } from '../server/services/entitlement.service'

describe('已购权益判定（8.4）', () => {
  it('isAllAccess：任一包时段即全放行', () => {
    expect(isAllAccess({ isDate: 1, isWeek: 1, isMonth: 1 })).toBe(false)
    expect(isAllAccess({ isDate: 2, isWeek: 1, isMonth: 1 })).toBe(true)
    expect(isAllAccess({ isDate: 1, isWeek: 2, isMonth: 1 })).toBe(true)
    expect(isAllAccess({ isDate: 1, isWeek: 1, isMonth: 2 })).toBe(true)
  })

  describe('getPayedVideos（ip/ua 任一命中、过期排除、包时段）', () => {
    const findMany = vi.fn()
    const tx = { payedShow: { findMany } } as never

    beforeEach(() => {
      findMany.mockReset()
    })

    const now = Date.now()
    const item = (vid: number, ip: string, ua: string | null, expireMs: number, extra: Partial<Record<'isDate' | 'isWeek' | 'isMonth', 1 | 2>> = {}) => ({
      vid,
      ip,
      ua,
      orderSn: `SN${vid}`,
      isDate: extra.isDate ?? 1,
      isWeek: extra.isWeek ?? 1,
      isMonth: extra.isMonth ?? 1,
      expire: new Date(expireMs),
    })

    it('ip 命中 → 放行；过期记录被过滤', async () => {
      findMany.mockResolvedValue([item(1, '1.2.3.4', null, now + 86400000)])
      const r = await getPayedVideos(tx, { ip: '1.2.3.4', ua: null })
      expect(r.vid).toEqual([1])
      expect(r.sn).toBe('SN1')
      // 查询条件含过期过滤
      const where = findMany.mock.calls[0][0].where
      expect(where.expire.gt).toBeInstanceOf(Date)
      expect(where.OR).toEqual([{ ip: '1.2.3.4' }])
    })

    it('指纹 ua 命中（ip 不同）→ 放行', async () => {
      findMany.mockResolvedValue([item(7, '9.9.9.9', 'fp_abc', now + 86400000)])
      const r = await getPayedVideos(tx, { ip: '1.2.3.4', ua: 'fp_abc' })
      expect(r.vid).toEqual([7])
    })

    it('均未命中 → 空权益', async () => {
      findMany.mockResolvedValue([])
      const r = await getPayedVideos(tx, { ip: '5.6.7.8', ua: 'fp_nope' })
      expect(r.vid).toEqual([])
      expect(r.sn).toBeNull()
    })

    it('包月权益 → isMonth=2', async () => {
      findMany.mockResolvedValue([item(3, '1.2.3.4', null, now + 30 * 86400000, { isMonth: 2 })])
      const r = await getPayedVideos(tx, { ip: '1.2.3.4', ua: null })
      expect(r.isMonth).toBe(2)
      expect(isAllAccess(r)).toBe(true)
    })

    it('trustIp（携单号找回）优先于当前 ip', async () => {
      findMany.mockResolvedValue([item(5, '88.88.88.88', null, now + 86400000)])
      const r = await getPayedVideos(tx, { ip: '99.99.99.99', ua: null, trustIp: '88.88.88.88' })
      expect(r.vid).toEqual([5])
      expect(findMany.mock.calls[0][0].where.OR).toEqual([{ ip: '88.88.88.88' }])
    })
  })
})
