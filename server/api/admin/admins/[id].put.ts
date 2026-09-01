import { defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'
import { computePidTop } from '../../../services/admin.service'

/** PUT /api/admin/admins/:id 编辑代理 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }

  const admin = await prisma.admin.findUnique({ where: { id } })
  if (!admin) return { code: 0, msg: '代理不存在', data: null }
  if (admin.role === 'admin' && id !== 1) {
    return { code: 0, msg: '不能编辑站长账号', data: null }
  }

  const body = await readBody(event).catch(() => ({}))
  const pid = body.pid !== undefined ? Number(body.pid) : admin.pid
  const pidTop = pid === admin.pid ? admin.pidTop : await computePidTop(prisma, pid)

  const data: any = {
    nickname: body.nickname !== undefined ? String(body.nickname) : admin.nickname,
    pid,
    pidTop,
    viewId: body.viewId !== undefined ? Number(body.viewId) : admin.viewId,
    kouliang: body.kouliang !== undefined ? Math.max(0, Number(body.kouliang)) : admin.kouliang,
    ticheng: body.ticheng !== undefined ? Math.min(100, Math.max(0, Number(body.ticheng))) : admin.ticheng,
    minFee: body.minFee !== undefined ? Math.max(0, Number(body.minFee)) : admin.minFee,
    poundage: body.poundage !== undefined ? Math.min(100, Math.max(0, Number(body.poundage))) : admin.poundage,
    dateFee: body.dateFee !== undefined ? Math.max(0, Number(body.dateFee)) : admin.dateFee,
    weekFee: body.weekFee !== undefined ? Math.max(0, Number(body.weekFee)) : admin.weekFee,
    monthFee: body.monthFee !== undefined ? Math.max(0, Number(body.monthFee)) : admin.monthFee,
    bt: body.bt !== undefined ? (Number(body.bt) === 1 ? 1 : 0) : admin.bt,
    by: body.by !== undefined ? (Number(body.by) === 1 ? 1 : 0) : admin.by,
    payModel: body.payModel !== undefined ? String(body.payModel) : admin.payModel,
    payModel1: body.payModel1 !== undefined ? String(body.payModel1) : admin.payModel1,
    wxCheckApi: body.wxCheckApi !== undefined ? String(body.wxCheckApi) : admin.wxCheckApi,
    txPassword: body.txPassword !== undefined ? String(body.txPassword) : admin.txPassword,
    status: body.status !== undefined ? String(body.status) : admin.status,
  }

  if (body.password && String(body.password).length >= 6) {
    data.password = bcrypt.hashSync(String(body.password), 10)
  }

  await prisma.admin.update({ where: { id }, data })
  await writeAdminLog(event, {
    title: '编辑代理',
    content: `编辑代理 ${admin.username}（ID:${id}）`,
  })
  return { code: 1, msg: 'success', data: { id } }
})
