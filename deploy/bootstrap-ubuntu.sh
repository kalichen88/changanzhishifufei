#!/usr/bin/env bash
# ============================================================
# 一次性服务器引导脚本（Ubuntu 20.04 / 22.04 / 24.04）
# 用途：安装 Docker + Docker Compose、创建部署目录、准备 .env
# 用法（服务器上以 root 执行，或 sudo bash deploy/bootstrap-ubuntu.sh）：
#   bash deploy/bootstrap-ubuntu.sh
# ============================================================
set -e

APP_DIR="${APP_DIR:-/opt/chang-an-knowledge}"

echo "==> 1/4 安装 Docker 与 Docker Compose"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "    Docker 已安装，跳过"
fi
systemctl enable --now docker

echo "==> 2/4 创建部署目录 $APP_DIR"
mkdir -p "$APP_DIR"

echo "==> 3/4 准备 .env 模板"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'EOF'
# ===== 数据库 / Redis（Docker 内网地址，勿改 host） =====
DATABASE_URL=mysql://root:changeme_strong_pw@mysql:3306/chang_an
REDIS_URL=redis://redis:6379

# ===== 安全（务必改为强随机串，上线后不可再改） =====
JWT_SECRET=replace_with_strong_random_string_1
HASHIDS_SALT=replace_with_strong_random_string_2
HASHIDS_MIN_LENGTH=4

# ===== 设备拦截 =====
DEVICE_BLOCK_PC=true
DEVICE_ALLOW_TABLET=true

# ===== 业务 =====
SINGLE_EXPIRE_DAYS=1
MAX_LEVEL=3
MULTI_LEVEL_COMMISSION=true

# ===== 支付占位 =====
PAY_MOCK_ENABLED=true

# ===== 部署 =====
HOST=0.0.0.0
PORT=3000
EOF
  echo "    已生成 .env 模板，请编辑 $APP_DIR/.env 填入真实密码/密钥"
else
  echo "    .env 已存在，跳过（不会被覆盖）"
fi

echo "==> 4/4 完成"
echo "------------------------------------------------------------"
echo " 下一步："
echo "  1) 编辑 $APP_DIR/.env 填入强随机 JWT_SECRET / HASHIDS_SALT"
echo "  2) 将项目代码放入 $APP_DIR （git clone 或从本机 scp/rsync）"
echo "  3) 在 $APP_DIR 执行:  docker compose up -d --build"
echo "  4) 验证:             curl http://127.0.0.1:3000/health"
echo "------------------------------------------------------------"
