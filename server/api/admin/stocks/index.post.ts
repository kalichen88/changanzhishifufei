import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/stocks 新增视频（全外链） */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const title = String(body.title || '').trim()
  const img = String(body.img || '').trim()
  const url = String(body.url || '').trim()
  const url2 = String(body.url2 || '').trim()
  const url3 = String(body.url3 || '').trim()

  if (!title) return { code: 0, msg: '请输入标题', data: null }
  if (!/^https?:\/\//.test(img) && !/^\/\//.test(img)) {
    return { code: 0, msg: '封面URL 必须为 http(s) 外链', data: null }
  }
  if (!/^https?:\/\//.test(url) && !/^\/\//.test(url)) {
    return { code: 0, msg: '视频URL 必须为 http(s) 外链', data: null }
  }

  const stock = await prisma.stock.create({
    data: {
      cid: Number(body.cid || 0),
      uid: 0,
      title,
      img,
      url,
      url2: url2 || null,
      url3: url3 || null,
      status: Number(body.status || 1) === 2 ? 2 : 1,
      sort: Number(body.sort || 0),
    },
  })
  await writeAdminLog(event, { title: '新增视频', content: `新增视频【${title}】(ID:${stock.id})` })
  return { code: 1, msg: 'success', data: { id: stock.id } }
})
