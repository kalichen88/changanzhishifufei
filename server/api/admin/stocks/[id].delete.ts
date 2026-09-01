import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** DELETE /api/admin/stocks/:id 删除视频 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const s = await prisma.stock.findUnique({ where: { id } })
  if (!s) return { code: 0, msg: '视频不存在', data: null }

  await prisma.stockPrice.deleteMany({ where: { stockId: id } })
  await prisma.stock.delete({ where: { id } })
  await writeAdminLog(event, { title: '删除视频', content: `删除视频【${s.title}】(ID:${id})` })
  return { code: 1, msg: 'success', data: { id } }
})
