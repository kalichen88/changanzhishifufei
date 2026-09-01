import type { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { getConfigBool } from '../utils/config'

/**
 * 域名分配 / 指派（见文档 8.2，强化原版 getDomain 半成品）
 *
 * 类型：1=入口(sn找回)  2=落地(推广主链)  3=支付(可选占位)
 * 取域名优先级：
 *   1. 代理自己的 wx_check_api（独立防封入口）
 *   2. 代理已绑定 type=2 的域名（一代理一域名）
 *   3. 回退公共池（status=1 且 is_bind=0，按 domain_rules.get_count 轮询）
 */

export interface DomainAgent {
  id: number
  pid: number
  pidTop: number
  wxCheckApi: string | null
}

export async function getDomainAgent(uid: number): Promise<DomainAgent | null> {
  return prisma.admin.findUnique({
    where: { id: uid },
    select: { id: true, pid: true, pidTop: true, wxCheckApi: true },
  })
}

/** 从域名库取一条 status=1 的指定类型域名（公共池，含已绑定——绑定者自身优先） */
export async function getDomainFromLib(type: number, uid?: number): Promise<string | null> {
  const d = await prisma.domainLib.findFirst({
    where: { type, status: 1 },
    orderBy: [{ isBind: 'asc' }, { id: 'asc' }],
  })
  if (!d) return null
  return normalizeDomain(d.domain)
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/** 取代理独立推广域名（一代理一域名 type=2） */
export async function getAgentBoundDomain(uid: number, type = 2): Promise<string | null> {
  const d = await prisma.domainLib.findFirst({
    where: { uid, type, status: 1, isBind: 1 },
    orderBy: { id: 'asc' },
  })
  return d ? normalizeDomain(d.domain) : null
}

/**
 * 推广主链域名（还原 Link::getPushUrl 优先级 + 强化绑定）
 * 返回裸域名（不含协议）
 */
export async function getPushUrl(uid: number): Promise<string> {
  const agent = await getDomainAgent(uid)
  if (!agent) throw new Error('代理不存在')

  // 1. 独立防封入口域名
  if (agent.wxCheckApi) return normalizeDomain(agent.wxCheckApi)

  // 2. 代理绑定 type=2 落地域名
  const bound = await getAgentBoundDomain(uid, 2)
  if (bound) return bound

  // 3. 公共池
  const pool = await getDomainFromLib(2, uid)
  if (pool) return pool

  throw new Error('需要添加主域名才能生成推广链接')
}

/** 落地/支付 URL 域名（type 默认 2；支付域名 3 无则回落 2） */
export async function getLandingUrl(uid: number, type = 2): Promise<string> {
  const agent = await getDomainAgent(uid)
  const base = agent?.wxCheckApi ? normalizeDomain(agent.wxCheckApi) : null
  if (base && type === 2) return base
  const bound = await getAgentBoundDomain(uid, type)
  if (bound) return bound
  const pool = await getDomainFromLib(type, uid)
  if (pool) return pool
  return getDomainFromLib(2, uid) ?? ''
}

/**
 * 代理自助/站长代领：从公共池领取一个未绑定 type=2 域名
 * 优先 status=1 且 is_bind=0；返回 null 表示池不足
 */
export async function autoAssignDomain(
  tx: Prisma.TransactionClient,
  uid: number,
  type = 2,
): Promise<{ id: number; domain: string } | null> {
  // 已绑定则直接返回
  const existing = await tx.domainLib.findFirst({ where: { uid, type, status: 1, isBind: 1 } })
  if (existing) return { id: existing.id, domain: existing.domain }

  const candidate = await tx.domainLib.findFirst({
    where: { type, status: 1, isBind: 0 },
    orderBy: { id: 'asc' },
  })
  if (!candidate) return null

  await tx.domainLib.update({
    where: { id: candidate.id },
    data: { uid, isBind: 1, bindTime: new Date() },
  })
  return { id: candidate.id, domain: candidate.domain }
}

/** 总后台指派域名给代理（唯一性校验：同 type 已绑定他人则阻断） */
export async function bindDomainToAgent(
  tx: Prisma.TransactionClient,
  domainId: number,
  uid: number,
): Promise<{ ok: boolean; msg?: string }> {
  const d = await tx.domainLib.findUnique({ where: { id: domainId } })
  if (!d) return { ok: false, msg: '域名不存在' }
  if (d.status !== 1) return { ok: false, msg: '域名已被屏蔽，无法指派' }

  // 该域名已被其他代理绑定 → 阻断（一域名只能绑定一个代理）
  if (d.isBind === 1 && d.uid !== 0 && d.uid !== uid) {
    return { ok: false, msg: `该域名已绑定给代理 ${d.uid}` }
  }

  // 该代理该类型已有绑定 → 先解绑旧的
  await tx.domainLib.updateMany({ where: { uid, type: d.type }, data: { isBind: 0, uid: 0, bindTime: null } })
  await tx.domainLib.update({ where: { id: domainId }, data: { uid, isBind: 1, bindTime: new Date() } })
  return { ok: true }
}

/** 回收域名 */
export async function unbindDomain(
  tx: Prisma.TransactionClient,
  domainId: number,
): Promise<void> {
  await tx.domainLib.update({
    where: { id: domainId },
    data: { uid: 0, isBind: 0, bindTime: null },
  })
}

/** 建代理时自动分配（AUTO_ASSIGN 开关，站长代领） */
export async function ensureAgentDomain(uid: number): Promise<void> {
  const enabled = await getConfigBool('AUTO_ASSIGN')
  if (!enabled) return
  await prisma.$transaction(async (tx) => {
    await autoAssignDomain(tx, uid, 2)
  })
}
