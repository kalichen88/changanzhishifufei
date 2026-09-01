import { defineEventHandler, readBody } from 'h3'
import { importStocks, parseTextLines } from '../../../services/import.service'
import { currentAdmin } from '../../../utils/admin'

/**
 * POST /api/admin/stocks/import-text 文本粘贴导入（还原原版 add_piliang）
 * body: { text, sort(0-6), stripCategory }
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) return { code: 0, msg: '未登录', data: null }
  const body = await readBody(event).catch(() => ({}))
  const text = String(body.text || '')
  const sort = Math.min(6, Math.max(0, Number(body.sort || 0)))
  const strip = Number(body.stripCategory) === 1

  if (!text.trim()) return { code: 0, msg: '请粘贴文本（每行：标题|视频地址|图片地址）', data: null }
  const rows = parseTextLines(text, sort)
  if (rows.length === 0) return { code: 0, msg: '未解析到有效行，请检查分隔符（|）', data: null }

  const result = await importStocks(rows, {
    operator: me.id,
    fileName: `文本导入-${sort}-${Date.now()}.txt`,
    stripCategory: strip,
  })
  return { code: 1, msg: 'success', data: result }
})
