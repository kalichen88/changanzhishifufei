import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { buildAgentTree, flattenTree } from '../../../services/admin.service'

/** GET /api/admin/admins 代理列表（分页 + 搜索 + 树视图） */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))
  const keyword = String(q.keyword || '').trim()
  const view = String(q.view || 'list') // list | tree

  if (view === 'tree') {
    const tree = await buildAgentTree(1)
    const flat = flattenTree(tree)
    return {
      code: 1,
      msg: 'success',
      data: { list: flat, total: flat.length, tree },
    }
  }

  const where: any = { role: 'agent' }
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { nickname: { contains: keyword } },
    ]
  }

  const [list, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, pid: true, pidTop: true, username: true, nickname: true,
        role: true, balance: true, kouliang: true, ticheng: true,
        minFee: true, poundage: true, dateFee: true, weekFee: true, monthFee: true,
        bt: true, by: true, payModel: true, payModel1: true, viewId: true,
        wxCheckApi: true, status: true, loginIp: true, loginTime: true,
        createdAt: true,
      },
    }),
    prisma.admin.count({ where }),
  ])

  return { code: 1, msg: 'success', data: { list, total, page, pageSize } }
})
