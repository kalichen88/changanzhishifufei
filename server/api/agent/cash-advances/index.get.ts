import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'

/** GET /api/agent/cash-advances 我的提现记录 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))
  const where: any = { uid: me.id }
  if (q.status !== undefined && q.status !== '') where.status = Number(q.status)

  const [list, total] = await Promise.all([
    prisma.cashAdvance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashAdvance.count({ where }),
  ])
  return { code: 1, msg: 'success', data: { list, total, page, pageSize } }
})
