import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().max(255),
  // bcrypt silently truncates at 72 chars — cap it here to avoid surprises
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterBody = z.infer<typeof registerSchema>
export type LoginBody = z.infer<typeof loginSchema>
