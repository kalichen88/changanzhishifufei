import { createClient } from 'redis'

const globalForRedis = globalThis as unknown as { redis?: ReturnType<typeof createClient> }

export function getRedis() {
  if (!globalForRedis.redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    const client = createClient({ url })
    client.on('error', (err) => console.error('[redis] error:', err))
    client.connect().catch((err) => console.error('[redis] connect error:', err))
    globalForRedis.redis = client
  }
  return globalForRedis.redis
}

// 便捷包装：自动重试连接
export async function redisIncr(key: string): Promise<number> {
  const r = getRedis()
  return r.incr(key)
}

export async function redisZAdd(key: string, score: number, member: string): Promise<void> {
  const r = getRedis()
  await r.zAdd(key, { score, value: member })
}

export async function redisSetNX(key: string, ttlSeconds: number): Promise<boolean> {
  const r = getRedis()
  const res = await r.set(key, '1', { NX: true, EX: ttlSeconds })
  return res === 'OK'
}
