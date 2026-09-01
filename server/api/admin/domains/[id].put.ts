import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** PUT /api/admin/domains/:id 编辑域名（域名/类型/状态） */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  if (!id) return { code: 0, msg: '参数错误', data: null }

  const d = await prisma.domainLib.findUnique({ where: { id } })
  if (!d) return { code: 0, msg: '域名不存在', data: null }

  const domain = body.domain ? String(body.domain).replace(/^https?:\/\//, '').replace(/\/+$/, '') : d.domain
  const type = body.type !== undefined ? Number(body.type) : d.type
  const status = body.status !== undefined ? Number(body.status) : d.status

  await prisma.domainLib.update({
    where: { id },
    data: { domain, type, status },
  })
  await writeAdminLog(event, { title: '编辑域名', content: `编辑域名 ${d.domain}` })
  return { code: 1, msg: 'success', data: { id } }
})
