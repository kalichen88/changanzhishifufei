import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { writeAdminLog } from '../../../../utils/admin'

/** POST /api/admin/domains/:id/bind 指派域名给代理 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const uid = Number(body.uid || 0)
  if (!id || !uid) return { code: 0, msg: '参数错误', data: null }

  const d = await prisma.domainLib.findUnique({ where: { id } })
  if (!d) return { code: 0, msg: '域名不存在', data: null }
  const agent = await prisma.admin.findUnique({ where: { id: uid } })
  if (!agent) return { code: 0, msg: '代理不存在', data: null }

  // 唯一性：同 (type, domain) 已绑他人 → 阻断
  const conflict = await prisma.domainLib.findFirst({
    where: { domain: d.domain, type: d.type, isBind: 1, uid: { not: uid } },
  })
  if (conflict) {
    return { code: 0, msg: `该域名已被代理【${conflict.uid}】绑定`, data: null }
  }

  await prisma.domainLib.update({
    where: { id },
    data: { uid, isBind: 1, bindTime: new Date(), status: 1 },
  })
  await writeAdminLog(event, {
    title: '指派域名',
    content: `域名 ${d.domain} 指派给代理 ${agent.username}（ID:${uid}）`,
  })
  return { code: 1, msg: 'success', data: { id, uid } }
})
