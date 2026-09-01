import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/hezis 新增盒子链接 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const uid = Number(body.uid || 0)
  if (!uid) return { code: 0, msg: '请选择代理', data: null }
  const h = await prisma.hezi.create({
    data: {
      uid,
      video: String(body.video || ''),
      title: String(body.title || '').slice(0, 20),
      status: String(body.status || '1'),
    },
  })
  await writeAdminLog(event, { title: '新增盒子', content: `代理 ID:${uid} 新增盒子 ID:${h.id}` })
  return { code: 1, msg: 'success', data: { id: h.id } }
})
