import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'
import { clearConfigCache } from '../../../utils/config'

/** PUT /api/admin/configs 批量保存配置（body: { values: { name: value } }） */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const values = body.values || {}
  if (typeof values !== 'object') return { code: 0, msg: '参数错误', data: null }

  let updated = 0
  for (const [name, value] of Object.entries(values)) {
    const row = await prisma.config.findUnique({ where: { name } })
    if (!row) {
      await prisma.config.create({ data: { name, title: name, value: String(value) } })
    } else {
      await prisma.config.update({ where: { name }, data: { value: String(value) } })
    }
    updated++
  }
  clearConfigCache()
  await writeAdminLog(event, { title: '保存配置', content: `保存系统配置 ${updated} 项` })
  return { code: 1, msg: 'success', data: { updated } }
})
