import { apiFetch } from './client'

export interface Card {
  id: number
  user_id: number
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  is_public: number  // 0 = private, 1 = public (SQLite integer)
  created_at: string
  updated_at: string
}

export interface CardBody {
  front_text?: string | null
  front_image_url?: string | null
  back_text?: string | null
  back_image_url?: string | null
  is_public?: boolean
}

export const getCards = () => apiFetch<Card[]>('/api/cards')

export const getCard = (id: number) => apiFetch<Card>(`/api/cards/${id}`)

export const createCard = (body: CardBody) =>
  apiFetch<Card>('/api/cards', { method: 'POST', body: JSON.stringify(body) })

export const updateCard = (id: number, body: CardBody) =>
  apiFetch<Card>(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteCard = (id: number) =>
  apiFetch<void>(`/api/cards/${id}`, { method: 'DELETE' })
