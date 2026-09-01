import * as XLSX from 'xlsx'
import { prisma } from '../utils/prisma'

/**
 * 片库表格导入服务（见文档 8.6）
 * - 文件导入：.xlsx/.csv（SheetJS 解析）
 * - 文本粘贴导入：还原原版 Stock::add_piliang 的 7 种字段顺序映射
 * - 自动分类：【标题】内文字匹配 category(type=page,status=normal)
 */

export interface ImportRow {
  title: string
  img: string
  url: string
  sort?: number
  status?: number
}

export interface ImportError {
  row: number
  reason: string
  raw?: string
}

/**
 * 文本粘贴字段顺序映射（还原原版 add_piliang）
 * 每行三字段用 | 分隔：sort 决定 标题/图片/视频 的取值下标
 */
const SORT_MAP: Record<number, { title: number; img: number; url: number }> = {
  0: { title: 0, img: 2, url: 1 },
  1: { title: 0, img: 2, url: 1 },
  2: { title: 0, img: 1, url: 2 },
  3: { title: 2, img: 1, url: 0 },
  4: { title: 1, img: 2, url: 0 },
  5: { title: 2, img: 0, url: 1 },
  6: { title: 1, img: 0, url: 2 },
}

/** 解析多行文本 → 行数组（原版 add_piliang 规则） */
export function parseTextLines(text: string, sort = 0): ImportRow[] {
  const map = SORT_MAP[sort] || SORT_MAP[0]
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const rows: ImportRow[] = []
  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim())
    if (parts.length < 3) continue
    rows.push({
      title: parts[map.title] || '',
      img: parts[map.img] || '',
      url: parts[map.url] || '',
    })
  }
  return rows
}

/** 提取【】内的分类名（还原原版正则：/(?<=【)[^】]+/） */
export function extractCategoryName(title: string): string | null {
  const m = title.match(/(?<=【)[^】]+/)
  return m ? m[0] : null
}

/** 解析 .xlsx/.csv Buffer → 行数组（表头：标题/封面URL/视频URL/分类/排序/状态） */
export function parseSheetFile(
  buffer: Buffer,
  opts: { fileName?: string } = {},
): ImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []

  const json: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  const rows: ImportRow[] = []
  for (const item of json) {
    const pick = (...keys: string[]): string => {
      for (const k of keys) {
        const v = item[k]
        if (v !== '' && v !== undefined && v !== null) return String(v).trim()
      }
      return ''
    }
    rows.push({
      title: pick('标题', 'title', 'Title', '名称', 'name'),
      img: pick('封面URL', '封面', 'img', '图片', 'image', '封面图'),
      url: pick('视频URL', '视频', 'url', '链接', '地址', 'video', '播放地址'),
      sort: Number(pick('排序', 'sort') || 0),
      status: Number(pick('状态', 'status') || 1),
    })
  }
  return rows
}

/**
 * 执行片库入库（文件与文本共用管线）
 * 返回 { total, success, failed, errors }
 */
export async function importStocks(
  rows: ImportRow[],
  opts: { operator: number; fileName: string; stripCategory?: boolean },
): Promise<{ total: number; success: number; failed: number; errors: ImportError[] }> {
  const total = rows.length
  if (total === 0) return { total: 0, success: 0, failed: 0, errors: [] }

  // 预载分类（type=page, status=normal）
  const cats = await prisma.category.findMany({
    where: { type: 'page', status: 'normal' },
    select: { id: true, name: true },
  })
  const catMap = new Map(cats.map((c) => [c.name, c.id]))

  // 任务记录
  const task = await prisma.importTask.create({
    data: { type: 'stock', fileName: opts.fileName, total, success: 0, failed: 0, status: 1, operator: opts.operator },
  })

  const errors: ImportError[] = []
  let success = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNo = i + 2 // 含表头
    const title = (r.title || '').trim()
    const img = (r.img || '').trim()
    const url = (r.url || '').trim()

    // 校验
    if (!title) {
      errors.push({ row: rowNo, reason: '标题为空', raw: title })
      continue
    }
    if (title.length > 255) {
      errors.push({ row: rowNo, reason: '标题超过 255 字符', raw: title })
      continue
    }
    if (!/^https?:\/\//.test(img) && !/^\/\//.test(img)) {
      errors.push({ row: rowNo, reason: '封面URL 必须为 http(s) 外链', raw: img })
      continue
    }
    if (!/^https?:\/\//.test(url) && !/^\/\//.test(url)) {
      errors.push({ row: rowNo, reason: '视频URL 必须为 http(s) 外链', raw: url })
      continue
    }

    // 分类匹配
    const catName = extractCategoryName(title)
    let cid = 0
    if (catName && catMap.has(catName)) cid = catMap.get(catName)!

    let finalTitle = title
    if (opts.stripCategory && catName) {
      finalTitle = title.replace(/【[^】]+】/g, '').trim()
      if (!finalTitle) finalTitle = title
    }

    // 幂等：同 (title,url) 已存在则跳过
    const dup = await prisma.stock.findFirst({
      where: { title: finalTitle, url },
    })
    if (dup) {
      errors.push({ row: rowNo, reason: `重复（与 ID:${dup.id} 相同标题+链接）`, raw: title })
      continue
    }

    try {
      await prisma.stock.create({
        data: {
          cid,
          uid: 0,
          title: finalTitle,
          img,
          url,
          status: r.status === 2 ? 2 : 1,
          sort: Number(r.sort || 0),
        },
      })
      success++
    } catch (e: any) {
      errors.push({ row: rowNo, reason: `写入失败：${e?.message || '未知错误'}`, raw: title })
    }
  }

  const failed = errors.length
  await prisma.importTask.update({
    where: { id: task.id },
    data: { success, failed, errors: errors.slice(0, 2000) as any, status: 2 },
  })

  return { total, success, failed, errors }
}

/** 生成导入模板 Buffer（xlsx） */
export function buildTemplateBuffer(): Buffer {
  const data = [
    ['标题', '封面URL', '视频URL', '分类', '排序', '状态'],
    ['【美景】云海日出', 'https://picsum.photos/seed/demo1/300/400', 'https://example.com/video.mp4', '美景', 0, 1],
    ['【运营】短视频起号', 'https://picsum.photos/seed/demo2/300/400', 'https://example.com/video2.mp4', '运营', 0, 1],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '片库导入')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
