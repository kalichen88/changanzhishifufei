import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { signToken, type AuthTokenPayload } from '../utils/jwt'
import { getRedis } from '../utils/redis'

/**
 * 后台 / 代理登录（JWT + Redis 会话，见文档 9.1）
 */

export interface LoginResult {
  ok: boolean
  msg?: string
  token?: string
  admin?: {
    id: number
    username: string
    nickname: string
    role: string
    pid: number
    pidTop: number
  }
}

export async function login(
  username: string,
  password: string,
  role: 'admin' | 'agent',
  ip: string,
): Promise<LoginResult> {
  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin || admin.role !== role) {
    return { ok: false, msg: '账号或密码错误' }
  }
  if (admin.status !== 'normal') {
    return { ok: false, msg: '该账号已被禁用' }
  }
  const valid = bcrypt.compareSync(password, admin.password)
  if (!valid) {
    return { ok: false, msg: '账号或密码错误' }
  }

  const payload: AuthTokenPayload = { uid: admin.id, role: admin.role as 'admin' | 'agent' }
  const token = signToken(payload)

  // Redis 会话：单点踢出（同账号新登录踢旧 token）
  const r = getRedis()
  await r
    .setEx(`session:${admin.id}:${token}`, 7 * 86400, String(admin.id))
    .catch(() => {})

  // 记录登录信息
  await prisma.admin
    .update({
      where: { id: admin.id },
      data: { loginIp: ip, loginTime: new Date() },
    })
    .catch(() => {})

  return {
    ok: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
      pid: admin.pid,
      pidTop: admin.pidTop,
    },
  }
}

export async function logout(token: string): Promise<void> {
  const r = getRedis()
  await r.del(`session:${token}`).catch(() => {})
}
