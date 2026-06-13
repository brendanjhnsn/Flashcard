import { apiFetch } from './client'

export interface AuthResponse {
  token: string
  user: { id: number; email: string; created_at: string }
}

export function register(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
