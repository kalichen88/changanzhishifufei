# 长安银河知识付费系统 · 复刻版

> 版本：v1.0.0 ｜ 技术栈：Nuxt 3（Nitro）+ Prisma + MySQL 8 + Redis 7
> 完整开发依据见本地《开发设计需求文档.md》（含原版源码逆向分析，仅本地维护、不随本仓库公开）

基于原版 FastAdmin/ThinkPHP5「长安银河/长安打赏系统」商业源码逆向复刻的多级代理分销 + 短视频/短剧内容付费 H5 平台。采用最新全栈技术栈重写，业务闭环完整，可直接部署上线（支付为占位，不接真实资金）。

---

## 1. 核心能力（对照原版保留 / 增强）

| 能力 | 说明 | 状态 |
|---|---|---|
| 多级代理分销 | 代理树（pid/pid_top）、独立定价（单片/包日/包周/包月）、多级提成差额瀑布分账 | ✅ 完整保留 |
| **扣量** | 每 N 单扣 1（N 每代理可配），扣量单全额入顶级代理、用户权益照发、今日扣量看板 | ✅ 完整保留 |
| **域名分配/指派** | 域名库 + 一代理一独立推广域名；指派后推广链自动切换 | ✅ 完整保留 |
| 免登录直购 | 访客免注册免登录，点视频封面直接拉起支付 | ✅ 完整保留 |
| **续播放行** | IP **或** 浏览器指纹 Cookie（`__fp` HttpOnly）任一项命中即放行已购视频 | ✅ 完整保留 + 服务端稳定指纹 |
| **设备/IP 识别** | 识别访客 IP + 设备，屏蔽 PC 端访问，仅手机访问；微信/QQ/抖音内置浏览器防封提示 | ✅ 完整保留 |
| H5 界面 | Vant4 高度还原原版 H5（列表/分类/搜索/详情/落地页） | ✅ 高度还原 |
| 总后台 | Element Plus 还原 FastAdmin 布局（13 个页面） | ✅ 高度还原 |
| 代理后台 | 独立后台 8 个页面（推广链接/二维码/订单/结算/定价/模板/域名） | ✅ 高度还原 |
| 片库表格导入 | Excel/CSV 批量导入 + 文本粘贴导入，媒体资源全部外链（封面图 URL + 视频 URL） | ✅ 增强 |
| 支付占位 | 模拟网关（默认）+ 易支付/码支付骨架（适配器模式，可平滑接入真实通道） | ✅ 占位 |
| 部署 | Docker Compose 一键起，香港/国外服务器 | ✅ 就绪 |

### 明确不实现（避免碎片）
- 不接真实资金支付通道（仅骨架）；不做 App/小程序；不做视频上传/转码/CDN（资源全外链）
- 不做前台会员体系 / 第三方登录 / 短信邮件（原版 FastAdmin 空壳，见设计文档 §1.5）

---

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 全栈框架 | **Nuxt 3（Nitro）** | 单仓库：前端 + 服务端 API + 中间件一体 |
| 语言 | TypeScript | 全栈类型安全 |
| H5 组件库 | **Vant 4** | 移动端，还原原版 SPA |
| 后台组件库 | **Element Plus** | 还原 FastAdmin 后台皮肤 |
| 样式 | SCSS | 移植原版视觉 |
| 数据库 | **MySQL 8** | utf8mb4 |
| 缓存/会话 | **Redis 7** | 登录态、扣量计数、防刷 |
| ORM | **Prisma** | schema 即文档 |
| Excel 导入 | SheetJS（xlsx） | .xlsx / .csv / 文本粘贴 |
| 二维码 | qrcode | 代理推广二维码 |
| 混淆编码 | hashids | 推广链接代理 ID 混淆（替代原版自研） |
| 校验 | zod | API 入参校验 |
| 部署 | Docker Compose | 香港/国外服务器 |

---

## 3. 目录结构

```
chang-an-knowledge/
├── assets/css/main.scss        # 全局样式（H5 主色 #f53036）
├── components/                 # 通用组件
├── composables/                # useApi / useH5 / useBackendAuth / useLocalStorage
├── layouts/                    # h5.vue / admin.vue / agent.vue（按路由自动切换）
├── pages/
│   ├── index.vue / list.vue / cat.vue / search.vue / v/[id].vue
│   ├── buy.vue / about.vue / t.vue / l.vue / pc-blocked.vue
│   ├── admin/                  # 总后台 13 页
│   └── agent/                  # 代理后台 8 页
├── server/
│   ├── api/                    # admin / agent / h5 / pay 四组 API
│   ├── middleware/             # deviceGuard / visitorFingerprint / auth
│   ├── plugins/autoseed.ts     # 启动自动幂等种子
│   ├── routes/health.get.ts    # GET /health 健康检查
│   ├── services/               # 业务服务（扣量/分账/权益/指纹/域名/导入/支付网关等）
│   └── utils/                  # prisma/redis/jwt/hashids/money/device/ip 等
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── seed.ts                 # 幂等种子（npm run db:seed）
├── tests/                      # Vitest 单元测试（38 用例）
├── Dockerfile / docker-compose.yml
└── .env.example                # 环境变量模板
```

---

## 4. 快速开始（本地开发）

### 4.1 前置依赖
- Node.js ≥ 20
- Docker（本地起 MySQL/Redis）

### 4.2 启动数据库
```powershell
# 仅起 MySQL 与 Redis（应用在宿主机跑）
docker compose up -d mysql redis
```

### 4.3 安装依赖并初始化
```powershell
npm install          # 自动执行 prisma generate（postinstall）
Copy-Item .env.example .env   # 首次复制环境变量，本地默认值即可直接用
npm run db:migrate   # 建表（prisma migrate dev）
npm run db:seed      # 写入演示数据（幂等；--force 可清空重置）
```

### 4.4 启动开发服务
```powershell
npm run dev
# H5： http://localhost:3000/t?f=YMwJ   （代理A入口）
# 总后台：http://localhost:3000/admin/login
# 代理后台：http://localhost:3000/agent/login
```

> 本地 H5 屏蔽 PC：用浏览器开发者工具切换到「手机模式」（iPad/iPhone/Android UA）访问，
> 或直接访问 `/t?f=YMwJ` 时以移动 UA 请求。

---

## 5. 生产部署（Docker Compose）

### 5.1 服务器准备
- 香港/国外 VPS（建议 2C4G+，MySQL 8 + Redis 7 + Node 20 均可装 Docker）
- 安装 Docker + Docker Compose v2
- 解析**至少一个域名**指向服务器（推荐两个：入口域名 + 落地域名）

### 5.2 上传代码并配置
```bash
# 服务器上
git clone <你的仓库> chang-an-knowledge
cd chang-an-knowledge
cp .env.example .env
# 务必修改 .env 中的强密码/密钥：
#   JWT_SECRET / HASHIDS_SALT 改为强随机长串（上线后不可再改）
#   如要承接旧站存量推广链接，HASHIDS_SALT 必须与原站一致
```

### 5.3 一键启动
```bash
docker compose up -d --build
```

`docker compose up` 会自动：
1. 启动 MySQL 8（utf8mb4）+ Redis 7，并等待健康检查
2. 构建 Nuxt 生产镜像
3. 容器启动时执行 `npx prisma migrate deploy`（自动建表/迁移）
4. 首次启动自动写入演示数据（幂等，已有数据不会覆盖）
5. 启动生产服务 `node .output/server/index.mjs`（端口 3000）

### 5.4 反向代理（Nginx 推荐）
```
server {
  listen 80;
  server_name m.yourdomain.com entry.yourdomain.com;  # 落地 + 入口域名
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
> 如开启 HTTPS，请正确透传 `X-Forwarded-For`，否则 IP 识别/续播放行会失效。

### 5.5 健康检查
```bash
curl http://127.0.0.1:3000/health
# {"code":1,"status":"ok","db":"ok"}
```

### 5.6 GitHub Actions 自动部署（推荐）

仓库已内置 CI/CD 工作流 `.github/workflows/deploy.yml`：每次 `git push` 到 `main`（或手动触发）会自动 SSH 到服务器执行 `git pull && docker compose up -d --build && 健康检查`，全程无需再上服务器。

**首次引导（只做一次，由我/你用 SSH 完成）**
1. 在服务器执行 `deploy/bootstrap-ubuntu.sh`（安装 Docker、生成 `.env` 模板）
2. 填入 `.env` 中的强随机 `JWT_SECRET` / `HASHIDS_SALT`
3. 克隆代码到部署目录

**配置 GitHub 仓库 Secrets（Settings → Secrets and variables → Actions）**

| Secret | 值 |
|---|---|
| `SERVER_HOST` | 服务器公网 IP |
| `SERVER_USER` | 部署用户（建议非 root 的专用用户，如 `deploy`） |
| `SERVER_PORT` | SSH 端口（默认 22） |
| `SERVER_SSH_KEY` | 服务器上该用户的**私钥**（公钥已加入 `authorized_keys`） |
| `SERVER_PATH` | 服务器上代码目录（如 `/home/ubuntu/apps/changanzhishifufei`） |

**私有仓库需要服务器也能 `git pull`**（否则 Actions 拉代码后服务器拉不到）：
- 推荐：在 GitHub 仓库 Settings → Deploy keys 添加一枚**只读部署公钥**，其私钥配置在服务器部署用户下
- 或使用 Personal Access Token 作为远程地址凭据（次选，安全性略低）

---

## 6. 环境变量（.env）

| 变量 | 默认 | 说明 |
|---|---|---|
| `DATABASE_URL` | `mysql://root:changan2026@mysql:3306/chang_an` | MySQL 连接串（Docker 内用 `mysql`，本地用 `localhost`） |
| `REDIS_URL` | `redis://redis:6379` | Redis 连接串 |
| `JWT_SECRET` | `change-me...` | **上线必改**；后台登录签名密钥 |
| `HASHIDS_SALT` | `change-me...` | **上线必改**；推广链接代理 ID 混淆盐。**要承接旧站存量推广链时须与原站一致** |
| `HASHIDS_MIN_LENGTH` | `4` | 混淆 ID 最小长度 |
| `DEVICE_BLOCK_PC` | `true` | 屏蔽 PC 端访问（仅手机） |
| `DEVICE_ALLOW_TABLET` | `true` | iPad 等平板是否放行 |
| `SINGLE_EXPIRE_DAYS` | `1` | 单片购买有效天数（还原原版=1；0=永久） |
| `MAX_LEVEL` | `3` | 分销层级上限（预留配置；当前链到顶级自动截断） |
| `MULTI_LEVEL_COMMISSION` | `true` | 是否开启多级分销提成（`false` 则只给直接上级） |
| `PAY_MOCK_ENABLED` | `true` | 是否启用模拟支付网关（占位） |
| `HOST` / `PORT` | `0.0.0.0` / `3000` | 监听地址/端口 |

---

## 7. 演示账号（首启种子自动写入）

> 全部密码：`123456`（生产部署后请立即在总后台修改）

| 账号 | 角色 | 说明 |
|---|---|---|
| `admin` | 站长（总后台） | 顶级，id=1，pid_top=1 |
| `agentA` | A 级代理 | 挂站长下，提成 20% |
| `agentB` | B 级代理 | 挂 A 下，提成 10%，**扣量 5（每 5 单扣 1）** |
| `agentC` | C 级代理 | 挂 B 下，提成 15%，扣量 3 |

种子还包含：11 个分类、10 个演示视频（外链）、5 个域名（含待指派域名）、
1 个域名取出规则、6 套落地模板、mock + epay 支付通道、全套系统配置。

---

## 8. 核心业务流程（使用说明）

### 8.1 域名分配 / 指派（一代理一独立推广域名）
1. 总后台 →「域名库」：录入落地域名（type=2）并启用
2. 总后台 →「代理管理」→ 选中代理 → 绑定域名（`/admin/domains` 绑定操作）
3. 指派后，该代理的推广链自动切换为 `http://{该代理域名}/t?f={hashids(uid)}`
4. 代理在「代理后台 → 推广」可复制链接 / 下载二维码，推广码即指向其独立域名

### 8.2 免登录直购 + 续播放行
1. 访客用手机打开推广链接 → 落地页/列表页（无需登录注册）
2. 点击视频封面 → 详情页 → 拉起支付（模拟网关秒到账）
3. 支付成功 → 立即播放；访客 `__fp` 指纹 Cookie（HttpOnly）已落库
4. 再次访问：**IP 或浏览器指纹任一项**命中即放行已购视频，无需再次付费

### 8.3 扣量（每 N 扣 1）
- 代理在总后台设置 `kouliang`（如 5 = 每 5 单扣 1）
- 第 N 单：金额全额计入 `pid_top`（顶级），卖单代理与上级均不入账，但**用户权益照发**（不影响访客）
- 总后台今日成交看板单独统计扣量单

### 8.4 多级分账（差额瀑布）
按代理链 `selling ← 上级 ← … ← 顶级`，每节点按自身 `ticheng` 上交，差额归己，任一链合计恒等于订单金额 100%（财务自洽）。

### 8.5 片库导入（外链）
总后台 →「片库」→ 导入：
- **Excel/CSV**：按模板（片名/封面URL/视频URL/分类/价格等列）上传 `.xlsx` / `.csv`
- **文本粘贴**：`【分类】标题|封面URL|视频URL` 格式，自动识别分类
- 导入任务可在「导入任务」页查看进度与失败明细；媒体资源仅存 URL，不入库二进制

### 8.6 支付占位
- 默认通道：`mock`（模拟网关，回调 `/api/pay/mock/callback` 秒到账）
- 骨架通道：`epay`（易支付 v4）/ `codepay_wx`，已在 `server/services/paygate.service.ts` 实现签名与回调验签
- 接入真实通道：新增一个适配器实现 `createOrder` + `handleNotify`，并在总后台「支付通道」录入配置即可；统一落单 `confirmPaid()`（幂等 + 防并发重复入账）

---

## 9. 访问地址总览

| 入口 | 地址 |
|---|---|
| H5 推广入口 | `http://{落地域名}/t?f={代理ID混淆码}` |
| H5 视频列表 | `/list`、`/cat`、`/search`、`/v/:id`、`/buy` |
| 总后台 | `/admin/login` |
| 代理后台 | `/agent/login` |
| 健康检查 | `/health` |

---

## 10. 测试与构建

```powershell
npm run test    # Vitest：38 用例（扣量/分账/权益/设备/导入/金额）
npm run build   # 全量编译生产构建（Nitro 输出 .output）
npm run preview # 本地预览生产构建
```

---

## 11. 运维与注意事项

- **上线前必做**：修改全部演示账号密码、更换 `JWT_SECRET` / `HASHIDS_SALT`
- `HASHIDS_SALT` 上线后不可再改（否则旧推广链接全部失效）
- 首次部署后如要重置演示数据：`docker compose exec app npx prisma db seed -- --force`（会清空业务表）
- 数据库备份：MySQL volume `mysql_data`；迁移自动执行，无需手工 `migrate deploy`
- 设备屏蔽依赖 `DEVICE_BLOCK_PC`；防封提示（微信/QQ/抖音）在总后台「系统配置」开关

---

## 12. 与本仓库原版源码的对应关系

- 原版源码位于仓库根目录（FastAdmin/ThinkPHP5 商业源码，仅作逆向依据，不参与构建）
- 设计文档 `docs/开发设计需求文档.md` 是唯一开发依据，包含逐项「保留/简化/新增」对照与验收标准
