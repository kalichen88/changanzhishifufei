import jwt from 'jsonwebtoken'

export interface AuthTokenPayload {
  uid: number
  role: 'admin' | 'agent'
  iat?: number
  exp?: number
}

export function signToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET || 'chang-an-dev-secret-change-me'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'chang-an-dev-secret-change-me'
    const decoded = jwt.verify(token, secret) as AuthTokenPayload
    return decoded
  } catch {
    return null
  }
}
