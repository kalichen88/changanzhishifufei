import type { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'

/**
 * 站长/代理管理服务（见文档 3 / 4.1）
 */

/** 沿 pid 链上溯计算 pid_top（顶级代理ID；到 pid=0 为止） */
export async function computePidTop(
  tx: Prisma.TransactionClient,
  pid: number,
): Promise<number> {
  let cur = pid
  let guard = 0
  while (cur > 0 && guard < 20) {
    const parent = await tx.admin.findUnique({
      where: { id: cur },
      select: { id: true, pid: true },
    })
    if (!parent) break
    if (parent.pid <= 0) return parent.id
    cur = parent.pid
    guard++
  }
  return cur || pid
}

/** 判断某代理是否在指定顶级代理名下（pid_top 匹配） */
export function underAgent(agent: { pidTop: number }, topUid: number): boolean {
  return agent.pidTop === topUid
}

/** 代理树（还原原版 getParent 递归；顶级 rootId 下的全部下级，含层级） */
export async function buildAgentTree(
  rootId: number,
): Promise<Array<Record<string, any>>> {
  const all = await prisma.admin.findMany({
    where: { role: 'agent', pidTop: rootId },
    select: {
      id: true, pid: true, pidTop: true, username: true, nickname: true,
      balance: true, kouliang: true, ticheng: true, status: true, viewId: true,
    },
  })
  const map = new Map<number, any>()
  for (const a of all) map.set(a.id, { ...a, children: [] })
  const roots: any[] = []
  for (const a of all) {
    const node = map.get(a.id)
    const parent = map.get(a.pid)
    if (parent) {
      parent.children.push(node)
    } else {
      // pid 不在集合内（越级/根直接下级）→ 视为根级
      roots.push(node)
    }
  }
  return roots
}

/** 树形展开为平铺列表（带 level），便于 UI 表格 */
export function flattenTree(
  nodes: Array<Record<string, any>>,
  level = 0,
): Array<Record<string, any>> {
  const out: Array<Record<string, any>> = []
  for (const n of nodes) {
    out.push({ ...n, level, children: undefined })
    if (n.children?.length) out.push(...flattenTree(n.children, level + 1))
  }
  return out
}
