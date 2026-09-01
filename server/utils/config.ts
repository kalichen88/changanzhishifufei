import { prisma } from './prisma'

// 系统配置 KV 读取（带 60s 内存缓存，避免每次读库）
const cache = new Map<string, { value: string; ts: number }>()
const TTL = 60_000

export async function getConfig(name: string): Promise<string> {
  const hit = cache.get(name)
  if (hit && Date.now() - hit.ts < TTL) return hit.value
  const row = await prisma.config.findUnique({ where: { name } })
  const value = row?.value ?? ''
  cache.set(name, { value, ts: Date.now() })
  return value
}

export async function getConfigBool(name: string): Promise<boolean> {
  return (await getConfig(name)) === '1'
}

export async function getConfigInt(name: string): Promise<number> {
  const v = Number(await getConfig(name))
  return Number.isFinite(v) ? v : 0
}

export function clearConfigCache(): void {
  cache.clear()
}
