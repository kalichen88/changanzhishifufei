import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/stocks 片库列表（分页 + 关键词/分类/状态筛选） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize || 20)))
  const keyword = String(q.keyword || '').trim()
  const cid = q.cid ? Number(q.cid) : undefined
  const status = q.status !== undefined && q.status !== '' ? Number(q.status) : undefined

  const where: any = {}
  if (keyword) where.title = { contains: keyword }
  if (cid && cid > 0) where.cid = cid
  if (status !== undefined && status !== -99) where.status = status

  const [list, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      orderBy: { inputTime: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stock.count({ where }),
  ])

  return { code: 1, msg: 'success', data: { list, total, page, pageSize } }
})
