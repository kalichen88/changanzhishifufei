import { defineEventHandler } from 'h3'

/**
 * 别名路由：/api/h5/pays → /api/h5/pay/options（还原原版 Index::pays 路径）
 */
export default defineEventHandler(async (event) => {
  const handler = await import('./pay/options').then((m) => m.default)
  return handler(event)
})
