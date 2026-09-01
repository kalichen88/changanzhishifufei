import { defineEventHandler, readMultipartFormData } from 'h3'
import { importStocks, parseSheetFile } from '../../../services/import.service'
import { currentAdmin } from '../../../utils/admin'

/**
 * POST /api/admin/stocks/import 文件批量导入（.xlsx/.csv）
 * multipart: file, stripCategory
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) return { code: 0, msg: '未登录', data: null }

  const parts = await readMultipartFormData(event).catch(() => null)
  if (!parts) return { code: 0, msg: '请上传 .xlsx/.csv 文件', data: null }

  const filePart = parts.find((p) => p.name === 'file' && p.data)
  const strip = parts.find((p) => p.name === 'stripCategory')?.data.toString() === '1'
  if (!filePart) return { code: 0, msg: '请选择文件', data: null }
  if (filePart.data.length > 10 * 1024 * 1024) {
    return { code: 0, msg: '文件不能超过 10MB', data: null }
  }

  const fileName = String(filePart.filename || 'import.xlsx')
  const rows = parseSheetFile(filePart.data, { fileName })
  if (rows.length === 0) {
    return { code: 0, msg: '未能从文件中解析到数据，请检查表头格式', data: null }
  }
  if (rows.length > 5000) return { code: 0, msg: '单次最多导入 5000 行', data: null }

  const result = await importStocks(rows, { operator: me.id, fileName, stripCategory: strip })
  return { code: 1, msg: 'success', data: result }
})
