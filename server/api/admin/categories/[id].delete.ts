import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** DELETE /api/admin/categories/:id 删除分类 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const cat = await prisma.category.findUnique({ where: { id } })
  if (!cat) return { code: 0, msg: '分类不存在', data: null }

  await prisma.stock.updateMany({ where: { cid: id }, data: { cid: 0 } })
  await prisma.category.delete({ where: { id } })
  await writeAdminLog(event, { title: '删除分类', content: `删除分类 ${cat.name}（ID:${id}）` })
  return { code: 1, msg: 'success', data: { id } }
})
