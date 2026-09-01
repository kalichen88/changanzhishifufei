import type { Prisma } from '@prisma/client'

/**
 * 已购权益 / 续播判定（还原原版 getPayedVideoId，见文档 8.4）
 *
 * 判定口径（三者取 or，任一命中即放行，全部在服务端）：
 *   __fp 指纹(优先) OR ua_md5 兜底 OR ip
 * 若 cookie('is_sn')==1（携单号找回）→ 使用订单记录的 ip 作为可信来源（允许换网络）
 */

export interface EntitlementQuery {
  ip: string
  ua: string | null // __fp 或 ua_md5
  /** 携单号找回时，订单里记录的可信 IP */
  trustIp?: string | null
}

export interface EntitlementResult {
  vid: number[]
  sn: string | null
  isDate: 1 | 2
  isWeek: 1 | 2
  isMonth: 1 | 2
  expire: Date | null
}

/**
 * 汇总已购权益：返回已购 vid 列表、首条订单号、包时段状态、最早到期时间
 * @param tx 可选事务客户端（无则用全局 prisma）
 */
export async function getPayedVideos(
  tx: Prisma.TransactionClient | typeof import('../utils/prisma').prisma,
  query: EntitlementQuery,
): Promise<EntitlementResult> {
  const ip = query.trustIp && query.trustIp !== '' ? query.trustIp : query.ip
  const now = new Date()

  const pay = await tx.payedShow.findMany({
    where: {
      expire: { gt: now },
      OR: [{ ip }, ...(query.ua ? [{ ua: query.ua }] : [])],
    },
    orderBy: { expire: 'desc' },
  })

  let isDate: 1 | 2 = 1
  let isWeek: 1 | 2 = 1
  let isMonth: 1 | 2 = 1
  for (const item of pay) {
    if (item.isDate === 2 && item.expire > now) isDate = 2
    if (item.isWeek === 2 && item.expire > now) isWeek = 2
    if (item.isMonth === 2 && item.expire > now) isMonth = 2
  }

  return {
    vid: pay.map((p) => p.vid),
    sn: pay[0]?.orderSn ?? null,
    isDate,
    isWeek,
    isMonth,
    expire: pay[0]?.expire ?? null,
  }
}

/** 是否为「全部放行」状态（包日/周/月任一有效） */
export function isAllAccess(r: Pick<EntitlementResult, 'isDate' | 'isWeek' | 'isMonth'>): boolean {
  return r.isDate === 2 || r.isWeek === 2 || r.isMonth === 2
}

/**
 * 写入已购权益（confirmPaid 在事务内调用）
 * expire 计算：单片=配置天数（0=永久）；包日=+1天；包周=+7天；包月=+30天
 */
export async function writePayedShow(
  tx: Prisma.TransactionClient,
  input: {
    vid: number
    uid: number
    ip: string
    ua: string | null
    orderSn: string
    isDate: number
    isWeek: number
    isMonth: number
    singleExpireDays: number
  },
): Promise<void> {
  const now = Date.now()
  let expire: number
  if (input.isDate === 2) expire = now + 86400_000
  else if (input.isWeek === 2) expire = now + 7 * 86400_000
  else if (input.isMonth === 2) expire = now + 30 * 86400_000
  else expire = input.singleExpireDays === 0 ? now + 3650 * 86400_000 : now + input.singleExpireDays * 86400_000

  await tx.payedShow.create({
    data: {
      vid: input.vid,
      uid: input.uid,
      ip: input.ip,
      ua: input.ua,
      orderSn: input.orderSn,
      isDate: input.isDate,
      isWeek: input.isWeek,
      isMonth: input.isMonth,
      expire: new Date(expire),
    },
  })
}
