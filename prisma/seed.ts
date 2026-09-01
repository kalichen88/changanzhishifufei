import { prisma } from '../server/utils/prisma'
import { seedIfEmpty } from '../server/utils/seed'

/**
 * 手动种子脚本：npm run db:seed
 * - 默认幂等：Admin 表已有数据则跳过
 * - 显式重置演示数据：npm run db:seed -- --force
 */
const force = process.argv.includes('--force')

async function main() {
  console.log('🌱 开始写入演示数据 ...')
  const r = await seedIfEmpty(force)
  if (r.seeded) {
    console.log('✅ ' + r.reason)
    console.log('   站长账号 admin / 123456（总后台）')
    console.log('   代理账号 agentA / agentB / agentC / 123456（代理后台）')
  } else {
    console.log('⏭  ' + r.reason)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
