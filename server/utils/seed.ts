import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

/**
 * 幂等种子数据（生产/开发首启自动写入）
 * - 若 Admin 表已有数据则跳过，避免重启覆盖线上数据
 * - force=true 时清空重写（仅用于显式演示重置）
 */
export async function seedIfEmpty(force = false): Promise<{ seeded: boolean; reason: string }> {
  const existing = await prisma.admin.count()
  if (existing > 0 && !force) {
    return { seeded: false, reason: `Admin 表已有 ${existing} 条记录，跳过种子数据` }
  }

  // ---- 清理（仅 force 或全新库） ----
  const clean = [
    'payedShow', 'payOrder', 'moneyLog', 'cashAdvance', 'stockPrice',
    'stock', 'link', 'domainLib', 'adminLog', 'visitorTrack',
    'deviceFingerprint', 'importTask', 'notify', 'complain', 'domainRule',
  ] as const
  for (const m of clean) {
    await (prisma as any)[m].deleteMany({})
  }
  await prisma.admin.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.config.deleteMany({})
  await prisma.muban.deleteMany({})
  await prisma.payChannel.deleteMany({})
  await prisma.hezi.deleteMany({})

  const pwd = bcrypt.hashSync('123456', 10)

  // ---- 站长（id=1）+ 代理树 ----
  // 显式固定代理 ID（2/3/4），保证推广链接 hashids 稳定可复现
  const boss = await prisma.admin.create({
    data: {
      id: 1, username: 'admin', nickname: '站长', password: pwd, role: 'admin',
      pid: 0, pidTop: 1, viewId: 1, kouliang: 0, ticheng: 0,
      dateFee: 10, weekFee: 30, monthFee: 50, bt: 1, by: 1,
      payModel: 'mock', payModel1: 'epay', status: 'normal', balance: 0,
    },
  })

  // A 级代理：直接挂站长
  const agentA = await prisma.admin.create({
    data: {
      id: 2, username: 'agentA', nickname: '总代A', password: pwd, role: 'agent',
      pid: boss.id, pidTop: boss.id, viewId: 2, kouliang: 0, ticheng: 20,
      dateFee: 8, weekFee: 25, monthFee: 40, bt: 1, by: 1,
      payModel: 'mock', status: 'normal', balance: 0,
    },
  })

  // B 级代理：挂 A
  const agentB = await prisma.admin.create({
    data: {
      id: 3, username: 'agentB', nickname: '二级代理B', password: pwd, role: 'agent',
      pid: agentA.id, pidTop: boss.id, viewId: 3, kouliang: 5, ticheng: 10,
      dateFee: 6, monthFee: 30, bt: 1, by: 1, payModel: 'mock',
      status: 'normal', balance: 0,
    },
  })

  // C 级代理：挂 B（测试三级）
  await prisma.admin.create({
    data: {
      id: 4, username: 'agentC', nickname: '三级代理C', password: pwd, role: 'agent',
      pid: agentB.id, pidTop: boss.id, viewId: 4, kouliang: 3, ticheng: 15,
      dateFee: 5, monthFee: 25, bt: 1, by: 1, payModel: 'mock',
      status: 'normal', balance: 0,
    },
  })

  // 重置 admin 自增，确保后续新建代理从 5 开始
  await prisma.$executeRawUnsafe('ALTER TABLE admins AUTO_INCREMENT = 1').catch(() => {})

  // ---- 分类（还原原版 page 分类） ----
  const catNames = ['山水', '美景', '编程', '媒体', '淘宝', '推广', 'ps', '摄影', '运营', '创业', '明星']
  const cats: { id: number }[] = []
  for (let i = 0; i < catNames.length; i++) {
    const c = await prisma.category.create({
      data: { type: 'page', name: catNames[i], status: 'normal', weigh: 50 - i },
    })
    cats.push(c)
  }

  // ---- 落地模板 ----
  const mubanDefs = [
    { id: 1, title: 'SPA 炫彩版', muban: 'spa' },
    { id: 2, title: '模板一', muban: 'muban1' },
    { id: 3, title: '模板二', muban: 'muban2' },
    { id: 4, title: '模板三', muban: 'muban3' },
    { id: 5, title: '模板四', muban: 'muban4' },
    { id: 6, title: '模板五', muban: 'muban5' },
  ]
  for (const m of mubanDefs) {
    await prisma.muban.create({
      data: { id: m.id, uid: 1, title: m.title, muban: m.muban, status: '1', desc: m.title },
    })
  }

  // ---- 域名库 ----
  await prisma.domainLib.createMany({
    data: [
      { domain: 'entry.demo.com', type: 1, status: 1 },   // 入口域名（sn 找回）
      { domain: 'm.demo.com', type: 2, status: 1 },       // 落地域名（推广主链）
      { domain: 'pay.demo.com', type: 3, status: 1 },     // 支付域名（可选）
      { domain: 'agent-b.demo.com', type: 2, status: 1 }, // 待指派给代理B
      { domain: 'agent-c.demo.com', type: 2, status: 1 }, // 待指派给代理C
    ],
  })

  // ---- 域名取出规则 ----
  await prisma.domainRule.create({ data: { id: 1, getCount: 5 } })

  // ---- 系统配置（还原原版关键项） ----
  const configs: { name: string; title: string; value: string; type: string }[] = [
    { name: 'name', title: '站点名称', value: '长安知识付费系统', type: 'string' },
    { name: 'version', title: '版本', value: '1.0.0', type: 'string' },
    { name: 'timezone', title: '时区', value: 'Asia/Shanghai', type: 'string' },
    { name: 'qiantao', title: '嵌套加密防封', value: '0', type: 'switch' },
    { name: 'DOMAIN_PRE', title: '落地域名随机前缀', value: '0', type: 'switch' },
    { name: 'daili_model', title: '是否取消三级限制', value: '1', type: 'switch' },
    { name: 'doiyin', title: '开启抖音落地隐链防封', value: '0', type: 'switch' },
    { name: 'isWechat', title: '微信跳出浏览器防封', value: '0', type: 'switch' },
    { name: 'isQQ', title: 'QQ跳出浏览器防封', value: '0', type: 'switch' },
    { name: 'isDouyin', title: '抖音跳出浏览器防封', value: '0', type: 'switch' },
    { name: 'price', title: '单片价格', value: '5', type: 'string' },
    { name: 'issk', title: '是否开启试看', value: '', type: 'string' },
    { name: 'biaoyu', title: '网站标语', value: '⭐鲜衣怒马少年时，一夜望尽长安花。\n⭐人生自信两百年，会当击水三千里。\n⭐零扣量、高质量、高稳定性的系统。', type: 'editor' },
    { name: 'biaoti', title: '网站标题', value: '商业化知识付费打赏系统', type: 'text' },
  ]
  for (const c of configs) {
    await prisma.config.create({ data: c })
  }

  // ---- 支付通道（mock 占位） ----
  await prisma.payChannel.create({
    data: { uid: 0, title: '模拟支付网关', model: 'mock', appId: 'mock-app', appKey: 'mock-key', payChannel: 'mock', payUrl: '', status: 1 },
  })
  await prisma.payChannel.create({
    data: { uid: 0, title: '易支付（骨架）', model: 'epay', appId: 'epay-pid', appKey: 'epay-key', payChannel: 'epay', payUrl: 'https://pay.example.com', status: 2 },
  })

  // ---- 片库（外链演示数据） ----
  const demoStocks = [
    { title: '【美景】云海日出延时摄影', cat: '美景' },
    { title: '【摄影】人像布光教程', cat: '摄影' },
    { title: '【运营】短视频起号方法论', cat: '运营' },
    { title: '【创业】从0到1副业指南', cat: '创业' },
    { title: '【编程】TypeScript 从入门到精通', cat: '编程' },
    { title: '【媒体】剪辑节奏进阶', cat: '媒体' },
    { title: '【推广】朋友圈获客实战', cat: '推广' },
    { title: '【ps】调色修图全流程', cat: 'ps' },
    { title: '【山水】航拍中国山水集', cat: '山水' },
    { title: '【明星】经典采访合集', cat: '明星' },
  ]
  for (const s of demoStocks) {
    const catIdx = Math.max(0, catNames.indexOf(s.cat))
    await prisma.stock.create({
      data: {
        title: s.title, uid: 0, cid: cats[catIdx].id,
        img: `https://picsum.photos/seed/${encodeURIComponent(s.title)}/300/400`,
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        status: 1, sort: 0,
      },
    })
  }

  return { seeded: true, reason: '演示数据写入完成' }
}
