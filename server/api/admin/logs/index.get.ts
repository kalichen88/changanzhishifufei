import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/logs 后台操作日志（精简） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 20)))
  const where: any = {}
  if (q.username) where.username = String(q.username)

  const [list, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminLog.count({ where }),
  ])
  return { code: 1, msg: 'success', data: { list, total, page, pageSize } }
})
