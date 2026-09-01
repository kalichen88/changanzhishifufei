import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { writeAdminLog } from '../../../../utils/admin'

/** POST /api/admin/orders/:id/mark 手工标记订单（对账辅助） */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const des = String(body.des || '')
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const o = await prisma.payOrder.findUnique({ where: { id } })
  if (!o) return { code: 0, msg: '订单不存在', data: null }
  await prisma.payOrder.update({ where: { id }, data: { des } })
  await writeAdminLog(event, { title: '标记订单', content: `订单 ${o.transact} 备注：${des}` })
  return { code: 1, msg: 'success', data: { id } }
})
