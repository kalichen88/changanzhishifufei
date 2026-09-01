import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/mubans 模板管理 */
export default defineEventHandler(async () => {
  const list = await prisma.muban.findMany({ orderBy: { id: 'asc' } })
  return { code: 1, msg: 'success', data: { list } }
})
