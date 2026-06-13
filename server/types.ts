// Augment Express's Request type so TypeScript knows about req.userId
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export interface User {
  id: number
  email: string
  password_hash: string
  created_at: string
}

export interface Card {
  id: number
  user_id: number
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  created_at: string
  updated_at: string
}
