import { z } from 'zod'

// Each side (front / back) must have at least text or an image URL
const sideSchema = z
  .object({
    text: z.string().min(1).max(10_000).nullable().optional(),
    image_url: z.string().url().nullable().optional(),
  })
  .refine((d) => d.text != null || d.image_url != null, {
    message: 'Must have at least text or an image URL',
  })

export const cardBodySchema = z
  .object({
    front_text: z.string().min(1).max(10_000).nullable().optional(),
    front_image_url: z.string().url().nullable().optional(),
    back_text: z.string().min(1).max(10_000).nullable().optional(),
    back_image_url: z.string().url().nullable().optional(),
  })
  .refine((d) => d.front_text != null || d.front_image_url != null, {
    message: 'Front must have at least text or an image URL',
    path: ['front'],
  })
  .refine((d) => d.back_text != null || d.back_image_url != null, {
    message: 'Back must have at least text or an image URL',
    path: ['back'],
  })

export type CardBody = z.infer<typeof cardBodySchema>
