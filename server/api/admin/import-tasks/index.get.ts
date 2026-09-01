import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/import-tasks 导入任务中心 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))
  const [list, total] = await Promise.all([
    prisma.importTask.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.importTask.count(),
  ])
  return { code: 1, msg: 'success', data: { list, total, page, pageSize } }
})
