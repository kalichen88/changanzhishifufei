import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** DELETE /api/admin/domains/:id 软删除域名（status=-1） */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const d = await prisma.domainLib.findUnique({ where: { id } })
  if (!d) return { code: 0, msg: '域名不存在', data: null }

  await prisma.domainLib.update({
    where: { id },
    data: { status: -1, isBind: 0, uid: 0, bindTime: null },
  })
  await writeAdminLog(event, { title: '删除域名', content: `删除域名 ${d.domain}` })
  return { code: 1, msg: 'success', data: { id } }
})
