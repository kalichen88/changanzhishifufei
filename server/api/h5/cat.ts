import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { obfuscateCat } from '../../utils/obfuscate'

/**
 * 分类列表（还原 Index::cat，见文档 8.7②）
 * 入参：limit 默认 9999；encode=0 返回混淆串（兼容旧版客户端），否则明文
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(Number(q.limit) || 9999, 9999)
  const encode = String(q.encode ?? '1')

  const list = await prisma.category.findMany({
    where: { type: 'page', status: 'normal' },
    orderBy: { weigh: 'desc' },
    take: limit,
    select: { id: true, image: true, name: true },
  })

  const data = list.map((c) => ({ id: c.id, image: c.image, title: c.name }))

  if (encode === '0') {
    return { status: 1, msg: 'success', data: obfuscateCat(data) }
  }
  return { code: 1, status: 1, msg: 'success', data }
})
