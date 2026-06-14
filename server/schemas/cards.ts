import { z } from 'zod'

const imageUrl = z.union([z.string().url(), z.string().startsWith('/uploads/')])

export const cardBodySchema = z
  .object({
    front_text: z.string().min(1).max(10_000).nullable().optional(),
    front_image_url: imageUrl.nullable().optional(),
    back_text: z.string().min(1).max(10_000).nullable().optional(),
    back_image_url: imageUrl.nullable().optional(),
    is_public: z.boolean().optional().default(false),
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
