import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/categories 分类管理（type=page 前台分类 + 其他） */
export default defineEventHandler(async () => {
  const list = await prisma.category.findMany({
    where: { type: 'page' },
    orderBy: [{ weigh: 'desc' }, { id: 'asc' }],
  })
  return { code: 1, msg: 'success', data: { list } }
})
