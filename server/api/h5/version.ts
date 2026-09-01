import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { getConfig } from '../../utils/config'

/**
 * 前端版本/公告（还原 Index::version）
 * 返回最新版本记录 + 公告内容
 */
export default defineEventHandler(async () => {
  const [version, notice] = await Promise.all([
    prisma.version.findFirst({
      where: { status: 'normal' },
      orderBy: [{ weigh: 'desc' }, { createdAt: 'desc' }],
    }),
    getConfig('notice').catch(() => ''),
  ])

  return {
    code: 1,
    msg: 'success',
    data: {
      version: version?.newVersion || '1.0.0',
      content: version?.content || '',
      notice,
    },
  }
})
