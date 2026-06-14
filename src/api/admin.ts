import { apiFetch } from './client'

export interface AdminUser {
  id: number
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface AdminCard {
  id: number
  user_id: number
  user_email: string
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  is_public: number
  created_at: string
  updated_at: string
}

export const getUsers = () => apiFetch<AdminUser[]>('/api/admin/users')

export const createUser = (body: { email: string; password: string; role?: 'user' | 'admin' }) =>
  apiFetch<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) })

export const updateUser = (id: number, body: { role?: 'user' | 'admin'; password?: string }) =>
  apiFetch<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteUser = (id: number) =>
  apiFetch<void>(`/api/admin/users/${id}`, { method: 'DELETE' })

export const getAdminCards = () => apiFetch<AdminCard[]>('/api/admin/cards')

export const updateAdminCard = (id: number, body: { is_public: boolean }) =>
  apiFetch<AdminCard>(`/api/admin/cards/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteAdminCard = (id: number) =>
  apiFetch<void>(`/api/admin/cards/${id}`, { method: 'DELETE' })
