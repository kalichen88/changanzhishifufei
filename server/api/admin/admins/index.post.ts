import { defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'
import { computePidTop } from '../../../services/admin.service'

/**
 * POST /api/admin/admins 新增代理
 * 自动回填 pid_top；可选 autoDomain=1 自动认领一个未绑定 type=2 域名
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const username = String(body.username || '').trim()
  const nickname = String(body.nickname || username).trim()
  const password = String(body.password || '123456')
  const pid = Number(body.pid || 0)

  if (!username) return { code: 0, msg: '请输入账号', data: null }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return { code: 0, msg: '账号需为 3-30 位字母数字下划线', data: null }
  }
  if (password.length < 6) return { code: 0, msg: '密码至少 6 位', data: null }

  const exists = await prisma.admin.findUnique({ where: { username } })
  if (exists) return { code: 0, msg: '账号已存在', data: null }

  const pidTop = await computePidTop(prisma, pid)

  const agent = await prisma.admin.create({
    data: {
      username,
      nickname,
      password: bcrypt.hashSync(password, 10),
      role: 'agent',
      pid,
      pidTop,
      viewId: Number(body.viewId || 4),
      kouliang: Math.max(0, Number(body.kouliang || 0)),
      ticheng: Math.min(100, Math.max(0, Number(body.ticheng || 0))),
      minFee: Math.max(0, Number(body.minFee || 0)),
      poundage: Math.min(100, Math.max(0, Number(body.poundage || 0))),
      dateFee: Math.max(0, Number(body.dateFee || 0)),
      weekFee: Math.max(0, Number(body.weekFee || 0)),
      monthFee: Math.max(0, Number(body.monthFee || 0)),
      bt: Number(body.bt) === 1 ? 1 : 0,
      by: Number(body.by) === 1 ? 1 : 0,
      payModel: String(body.payModel || 'mock'),
      payModel1: String(body.payModel1 || '0'),
      wxCheckApi: String(body.wxCheckApi || ''),
      txPassword: String(body.txPassword || ''),
      status: 'normal',
      balance: 0,
    },
  })

  // 可选：自动认领一个未绑定 type=2 域名（一代理一域名）
  if (Number(body.autoDomain) === 1) {
    const domain = await prisma.domainLib.findFirst({
      where: { type: 2, status: 1, isBind: 0 },
      orderBy: { id: 'asc' },
    })
    if (domain) {
      await prisma.domainLib.update({
        where: { id: domain.id },
        data: { uid: agent.id, isBind: 1, bindTime: new Date() },
      })
    }
  }

  await writeAdminLog(event, {
    title: '新增代理',
    content: `新增代理 ${username}（ID:${agent.id}，上级:${pid}，pid_top:${pidTop}）`,
  })

  return { code: 1, msg: 'success', data: { id: agent.id } }
})
