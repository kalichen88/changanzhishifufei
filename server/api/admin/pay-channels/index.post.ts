import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/pay-channels 新增通道 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const model = String(body.model || '').trim()
  if (!model) return { code: 0, msg: '请输入通道标识', data: null }

  const dup = await prisma.payChannel.findUnique({ where: { model } })
  if (dup) return { code: 0, msg: '通道标识已存在', data: null }

  const ch = await prisma.payChannel.create({
    data: {
      uid: Number(body.uid || 0),
      title: String(body.title || model),
      model,
      appId: String(body.appId || ''),
      appKey: String(body.appKey || ''),
      payChannel: String(body.payChannel || model),
      payUrl: String(body.payUrl || ''),
      status: Number(body.status || 2) === 1 ? 1 : 2,
    },
  })
  await writeAdminLog(event, { title: '新增支付通道', content: `新增通道 ${model}` })
  return { code: 1, msg: 'success', data: { id: ch.id } }
})
