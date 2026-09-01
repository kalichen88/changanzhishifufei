import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveAgent, getStockPrice } from '../../../services/h5.service'
import { getLandingUrl } from '../../../services/domain.service'
import { getConfigBool } from '../../../utils/config'

/**
 * 支付选项（还原 Index::pays，见文档 8.7③）
 * 入参：f 必填；vid 必填；money 选填（单片展示价）
 * 响应：{ stock:{title}, pay:[{name,url,flg,money,img}], user:{...} }
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const f = String(q.f || '')
  const vid = Number(q.vid || 0)
  const moneyParam = Number(q.money || 0)

  const agent = await resolveAgent(f)
  if (!agent || agent.status !== 'normal') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '该用户已经被禁用!', data: null }
  }

  const stock = await prisma.stock.findUnique({ where: { id: vid } })
  if (!stock) {
    return { code: 0, msg: '视频资源丢失!', data: null }
  }

  // pay_model / pay_model1 空 → 回退站长(id=1)
  const owner = agent.id === 1 ? agent : (await prisma.admin.findUnique({ where: { id: 1 } }))
  const payModel = agent.payModel || owner?.payModel || '0'
  const payModel1 = agent.payModel1 || owner?.payModel1 || '0'

  const payDomain = await getLandingUrl(agent.id, 3)
  const domain = payDomain || (await getLandingUrl(agent.id, 2))

  const singleMoney = moneyParam > 0 ? moneyParam : await getStockPrice(agent.id, vid)
  const pay: Array<{ name: string; url: string; flg: string; money: number; img: string }> = [
    {
      name: `单片购买 ${singleMoney} 元`,
      url: `http://${domain}/api/h5/pay/create?f=${f}&vid=${vid}`,
      flg: 'dan',
      money: 0,
      img: '/assets/list/muban1/vipicon.png',
    },
  ]

  if (agent.dateFee > 0 && agent.bt > 0) {
    pay.push({
      name: `包日观看全部 ${agent.dateFee} 元`,
      url: `http://${domain}/api/h5/pay/create?f=${f}&vid=${vid}&is_date=2`,
      flg: 'date_fee',
      money: agent.dateFee,
      img: '/assets/list/muban1/vipicon.png',
    })
  }

  // 包周默认不展示（原版注释未启用）；配置 SHOW_WEEK_FEE=true 时展示
  const showWeek = await getConfigBool('SHOW_WEEK_FEE')
  if (showWeek && agent.weekFee > 0) {
    pay.push({
      name: `包周观看全部 ${agent.weekFee} 元`,
      url: `http://${domain}/api/h5/pay/create?f=${f}&vid=${vid}&is_week=2`,
      flg: 'week_fee',
      money: agent.weekFee,
      img: '/assets/list/muban1/vipicon.png',
    })
  }

  if (agent.monthFee > 0 && agent.by > 0) {
    pay.push({
      name: `包月观看全部 ${agent.monthFee} 元`,
      url: `http://${domain}/api/h5/pay/create?f=${f}&vid=${vid}&is_month=2`,
      flg: 'month_fee',
      money: agent.monthFee,
      img: '/assets/list/muban1/vipicon.png',
    })
  }

  // user：去掉敏感字段（tx_img/kouliang/ticheng/balance/pwd/password/token/tx_password）
  const sensitive = new Set(['txImg', 'kouliang', 'ticheng', 'balance', 'pwd', 'password', 'token', 'txPassword', 'loginIp', 'loginTime'])
  const user: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(agent as unknown as Record<string, unknown>)) {
    if (!sensitive.has(k)) user[k] = v
  }
  user.payModel = payModel
  user.payModel1 = payModel1

  return {
    code: 1,
    msg: 'success',
    stock: { title: stock.title },
    pay,
    user,
  }
})
