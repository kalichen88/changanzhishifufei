import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveAgent } from '../../services/h5.service'

/**
 * 落地（还原 Index::lists，见文档 8.7）
 * 返回 localStorage 数据（uid/view_id/f/h_url）+ 模板 + 分类
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const f = String(q.f || '')

  const agent = await resolveAgent(f)
  if (!agent || agent.status !== 'normal') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '该用户已经被禁用!', data: null }
  }

  const muban = await prisma.muban.findUnique({ where: { id: agent.viewId } })
  const cats = await prisma.category.findMany({
    where: { type: 'page', status: 'normal' },
    orderBy: { weigh: 'desc' },
    select: { id: true, image: true, name: true },
  })

  return {
    code: 1,
    msg: 'success',
    data: {
      uid: agent.id,
      view_id: agent.viewId,
      muban: muban?.muban || 'spa',
      f,
      h_url: '', // 免费观看会员（原版字段，默认空）
      nickname: agent.nickname,
      redirect: '/list',
      cats,
    },
  }
})
