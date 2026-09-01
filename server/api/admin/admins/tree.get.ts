import { defineEventHandler } from 'h3'
import { buildAgentTree } from '../../../services/admin.service'

/** GET /api/admin/admins/tree 代理树（还原原版 getParent） */
export default defineEventHandler(async () => {
  const tree = await buildAgentTree(1)
  return { code: 1, msg: 'success', data: { tree } }
})
