import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/categories 新增分类 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const name = String(body.name || '').trim()
  if (!name) return { code: 0, msg: '请输入分类名称', data: null }

  const dup = await prisma.category.findFirst({ where: { name, type: 'page' } })
  if (dup) return { code: 0, msg: '分类名称已存在', data: null }

  const cat = await prisma.category.create({
    data: {
      type: 'page',
      name,
      nickname: String(body.nickname || ''),
      image: String(body.image || ''),
      weigh: Number(body.weigh || 0),
      status: String(body.status || 'normal'),
    },
  })
  await writeAdminLog(event, { title: '新增分类', content: `新增分类 ${name}（ID:${cat.id}）` })
  return { code: 1, msg: 'success', data: { id: cat.id } }
})
