import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** PUT /api/admin/pay-channels/:id 编辑/启停通道 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const body = await readBody(event).catch(() => ({}))
  const data: any = {}
  if (body.title !== undefined) data.title = String(body.title)
  if (body.appId !== undefined) data.appId = String(body.appId)
  if (body.appKey !== undefined) data.appKey = String(body.appKey)
  if (body.payChannel !== undefined) data.payChannel = String(body.payChannel)
  if (body.payUrl !== undefined) data.payUrl = String(body.payUrl)
  if (body.status !== undefined) data.status = Number(body.status) === 1 ? 1 : 2

  await prisma.payChannel.update({ where: { id }, data })
  await writeAdminLog(event, { title: '编辑支付通道', content: `编辑通道 ID:${id}` })
  return { code: 1, msg: 'success', data: { id } }
})
