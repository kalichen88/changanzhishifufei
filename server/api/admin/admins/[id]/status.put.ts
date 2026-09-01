import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { writeAdminLog } from '../../../../utils/admin'

/** PUT /api/admin/admins/:id/status 封禁/启用代理 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const status = ['normal', 'hidden', 'disabled'].includes(String(body.status))
    ? String(body.status)
    : 'normal'
  if (!id || id === 1) return { code: 0, msg: '不允许操作站长账号', data: null }

  const admin = await prisma.admin.findUnique({ where: { id } })
  if (!admin) return { code: 0, msg: '代理不存在', data: null }

  await prisma.admin.update({ where: { id }, data: { status } })
  await writeAdminLog(event, {
    title: '代理状态',
    content: `代理 ${admin.username}（ID:${id}）状态 → ${status}`,
  })
  return { code: 1, msg: 'success', data: { id, status } }
})
