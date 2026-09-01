import { defineEventHandler } from 'h3'
import { buildTemplateBuffer } from '../../../services/import.service'

/** GET /api/admin/import-tasks/template 下载导入模板 */
export default defineEventHandler(async (event) => {
  const buf = buildTemplateBuffer()
  setResponseHeaders(event, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="stock-import-template.xlsx"',
  })
  return new Response(buf)
})
