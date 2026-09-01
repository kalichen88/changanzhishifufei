import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** PUT /api/admin/stocks/:id 编辑视频 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const body = await readBody(event).catch(() => ({}))

  const s = await prisma.stock.findUnique({ where: { id } })
  if (!s) return { code: 0, msg: '视频不存在', data: null }

  const data: any = {}
  if (body.title !== undefined) data.title = String(body.title).trim()
  if (body.img !== undefined) data.img = String(body.img).trim()
  if (body.url !== undefined) data.url = String(body.url).trim()
  if (body.url2 !== undefined) data.url2 = String(body.url2).trim() || null
  if (body.url3 !== undefined) data.url3 = String(body.url3).trim() || null
  if (body.cid !== undefined) data.cid = Number(body.cid)
  if (body.sort !== undefined) data.sort = Number(body.sort)
  if (body.status !== undefined) data.status = Number(body.status) === 2 ? 2 : 1

  await prisma.stock.update({ where: { id }, data })
  await writeAdminLog(event, { title: '编辑视频', content: `编辑视频 ID:${id}` })
  return { code: 1, msg: 'success', data: { id } }
})
