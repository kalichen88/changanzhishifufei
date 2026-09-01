import { defineEventHandler, readBody } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { prisma } from '../../../utils/prisma'
import { toCents, centsToDecimal } from '../../../utils/money'

/**
 * POST /api/agent/cash-advances 申请提现
 * body: { money, password, account, type, image? }
 * 校验：提现密码 / 最低提现额 / 余额充足 / 无待审重复单
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const body = await readBody(event).catch(() => ({}))
  const money = String(body.money || '').trim()
  const password = String(body.password || '')
  const account = String(body.account || '').trim()
  const type = Number(body.type || 1)
  const image = String(body.image || '') || undefined

  if (!money || Number.isNaN(Number(money)) || Number(money) <= 0) {
    return { code: 0, msg: '请输入正确的提现金额', data: null }
  }
  if (!account) {
    return { code: 0, msg: '请输入收款账号', data: null }
  }

  const agent = await prisma.admin.findUnique({ where: { id: me.id } })
  if (!agent) return { code: 0, msg: '账号不存在', data: null }

  // 提现密码
  if (agent.txPassword && agent.txPassword !== password) {
    return { code: 0, msg: '提现密码错误', data: null }
  }

  // 最低提现额
  const minFee = Number(agent.minFee || 0)
  if (minFee > 0 && Number(money) < minFee) {
    return { code: 0, msg: `单笔最低提现 ${minFee} 元`, data: null }
  }

  // 余额充足
  const balanceCents = toCents(String(agent.balance))
  const moneyCents = toCents(money)
  if (moneyCents > balanceCents) {
    return { code: 0, msg: '余额不足', data: null }
  }

  // 无待审重复单
  const pending = await prisma.cashAdvance.findFirst({
    where: { uid: me.id, status: 0 },
  })
  if (pending) {
    return { code: 0, msg: '您有未处理的提现申请，请等待审核', data: null }
  }

  // 手续费
  const poundagePercent = Number(agent.poundage || 0)
  const poundageCents = Math.floor((moneyCents * poundagePercent) / 100)
  const realCents = moneyCents - poundageCents

  const cash = await prisma.cashAdvance.create({
    data: {
      uid: me.id,
      pid: agent.pid,
      money: centsToDecimal(moneyCents),
      poundage: centsToDecimal(poundageCents),
      realMoney: centsToDecimal(realCents),
      account,
      image,
      type,
      status: 0,
    },
  })

  return { code: 1, msg: '申请成功，等待站长审核', data: { id: cash.id } }
})
