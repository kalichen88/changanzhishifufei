import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/domains 批量新增域名（换行拆分，还原原版 Domain 批量新增） */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const raw = String(body.domains || '')
  const type = Number(body.type || 2)
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#'))
    .map((s) => s.replace(/^https?:\/\//, '').replace(/\/+$/, ''))

  if (lines.length === 0) return { code: 0, msg: '请粘贴域名（每行一个）', data: null }

  let success = 0
  const errors: string[] = []
  for (const domain of lines) {
    const dup = await prisma.domainLib.findFirst({ where: { domain, type } })
    if (dup) {
      errors.push(`${domain}：已存在`)
      continue
    }
    await prisma.domainLib.create({ data: { domain, type, status: 1 } })
    success++
  }

  await writeAdminLog(event, {
    title: '批量新增域名',
    content: `新增 type=${type} 域名 ${success} 个${errors.length ? `，失败 ${errors.length} 个` : ''}`,
  })
  return {
    code: 1,
    msg: 'success',
    data: { success, failed: errors.length, errors },
  }
})
