import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/configs 系统配置（对应原版 site.php 关键项） */
export default defineEventHandler(async () => {
  const list = await prisma.config.findMany({ orderBy: { sort: 'asc' } })
  return { code: 1, msg: 'success', data: { list } }
})
