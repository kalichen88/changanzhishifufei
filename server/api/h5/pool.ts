import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { encodeId } from '../../utils/hashids'
import { getConfigInt } from '../../utils/config'

/**
 * 公共池入口（无 f 访问时的兜底）
 * 未带推广码的访客 → 自动归属公共池代理（默认 uid=1 站长，可用配置 PUBLIC_POOL_UID 覆盖）
 * 返回公共池代理的 f 码，前端据此走标准落地流程，支付收益归属公共池代理
 */
export default defineEventHandler(async () => {
  let uid = await getConfigInt('PUBLIC_POOL_UID').catch(() => 0)
  if (!uid || uid <= 0) uid = 1

  const agent = await prisma.admin.findUnique({
    where: { id: uid },
    select: { id: true, nickname: true, status: true },
  })
  if (!agent) {
    return { code: 0, msg: '公共池未配置', data: null }
  }
  if (agent.status !== 'normal') {
    return { code: 0, msg: '该用户已经被禁用!', data: null }
  }

  return {
    code: 1,
    msg: 'success',
    data: {
      uid: agent.id,
      f: encodeId(agent.id),
      nickname: agent.nickname,
      redirect: `/l?f=${encodeId(agent.id)}`,
    },
  }
})
