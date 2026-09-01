import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'

/** GET /api/admin/import-tasks/:id 导入任务详情（含错误明细） */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const task = await prisma.importTask.findUnique({ where: { id } })
  if (!task) return { code: 0, msg: '任务不存在', data: null }
  return { code: 1, msg: 'success', data: task }
})
