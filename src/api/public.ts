import { apiFetch } from './client'

export interface PublicCard {
  id: number
  user_email: string
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  created_at: string
}

export const getPublicCards = () => apiFetch<PublicCard[]>('/api/public/cards')
