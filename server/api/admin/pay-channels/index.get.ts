import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/pay-channels 支付通道配置（占位） */
export default defineEventHandler(async () => {
  const list = await prisma.payChannel.findMany({ orderBy: { id: 'asc' } })
  return { code: 1, msg: 'success', data: { list } }
})
