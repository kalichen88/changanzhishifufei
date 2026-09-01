import { prisma } from '../utils/prisma'

/**
 * 健康检查（Docker healthcheck / 运维探活）
 * 返回 200 表示服务与数据库均正常
 */
export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { code: 1, status: 'ok', db: 'ok', ts: Date.now() }
  } catch (e) {
    setResponseStatus(500)
    return { code: 0, status: 'error', db: 'error', msg: (e as Error).message }
  }
})
