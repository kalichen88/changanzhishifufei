import { seedIfEmpty } from '../utils/seed'

/**
 * 服务启动自动种子（Nitro 插件，首启/迁移后执行）
 * - 幂等：Admin 表已有数据则跳过，不覆盖线上数据
 */
export default defineNitroPlugin(async () => {
  try {
    const r = await seedIfEmpty(false)
    if (r.seeded) {
      console.log('[autoseed] ✅ ' + r.reason)
    } else {
      console.log('[autoseed] ⏭ ' + r.reason)
    }
  } catch (e) {
    // 数据库尚未就绪等场景下不阻断服务，等待下次重启/手动 seed
    console.warn('[autoseed] ⚠️ 种子写入失败（可稍后 npm run db:seed 重试）：', (e as Error).message)
  }
})
