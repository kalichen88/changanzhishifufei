import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** DELETE /api/admin/hezis/:id 删除盒子 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  await prisma.hezi.delete({ where: { id } })
  return { code: 1, msg: 'success', data: { id } }
})
