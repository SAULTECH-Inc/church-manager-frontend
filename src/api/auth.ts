import { api } from './client'

export interface AuthUser {
  id: string
  email: string
  role: 'ADMIN' | 'PASTOR' | 'MINISTER' | 'MEMBER'
  displayName: string
  tenantId: string
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const res = await api.post<{ data: AuthUser & { token: string } }>('/api/auth/login', { email, password })
  const { token, ...user } = res.data.data
  return { user: user as AuthUser, token }
}

export async function signup(tenantName: string, adminEmail: string, adminPassword: string, subdomain: string, email?: string, phone?: string): Promise<AuthUser> {
  const res = await api.post<{ data: AuthUser }>('/api/auth/signup', { tenantName, adminEmail, adminPassword, subdomain, email, phone })
  return res.data.data
}

export async function logout() {
  await api.post('/api/auth/logout')
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<{ data: AuthUser }>('/api/auth/me')
  return res.data.data
}
