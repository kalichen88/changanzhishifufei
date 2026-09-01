export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: [
    'vant/lib/index.css',
    'element-plus/dist/index.css',
    '~/assets/css/main.scss',
  ],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:changan2026@localhost:3306/chang_an',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'chang-an-dev-secret-change-me',
    hashidsSalt: process.env.HASHIDS_SALT || 'chang-an-salt-dev',
    hashidsMinLength: Number(process.env.HASHIDS_MIN_LENGTH || 4),
    deviceBlockPc: (process.env.DEVICE_BLOCK_PC || 'true') === 'true',
    deviceAllowTablet: (process.env.DEVICE_ALLOW_TABLET || 'true') === 'true',
    singleExpireDays: Number(process.env.SINGLE_EXPIRE_DAYS || 1),
    payMockEnabled: (process.env.PAY_MOCK_ENABLED || 'true') === 'true',
  },
  modules: [],
  nitro: {
    // Nitro server handles /api/**; Nuxt pages handle the rest
  },
  app: {
    head: {
      title: '长安知识付费系统',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
    },
  },
})
