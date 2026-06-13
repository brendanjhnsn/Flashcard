import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import type { Card, CardBody } from '../api/cards'
import { uploadImage } from '../api/uploads'

// Mirror the server-side constraint: each side needs at least text or an image URL
const schema = z
  .object({
    front_text: z.string().max(10_000).optional(),
    front_image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    back_text: z.string().max(10_000).optional(),
    back_image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  })
  .refine((d) => d.front_text || d.front_image_url, {
    message: 'Front needs text or an image',
    path: ['front_text'],
  })
  .refine((d) => d.back_text || d.back_image_url, {
    message: 'Back needs text or an image',
    path: ['back_text'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  initial?: Card
  onSave: (body: CardBody) => Promise<void>
  onCancel: () => void
}

export function CardForm({ initial, onSave, onCancel }: Props) {
  const [uploading, setUploading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      front_text: initial?.front_text ?? '',
      front_image_url: initial?.front_image_url ?? '',
      back_text: initial?.back_text ?? '',
      back_image_url: initial?.back_image_url ?? '',
    },
  })

  async function handleFileUpload(field: 'front_image_url' | 'back_image_url', file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError(field, { message: 'File must be under 5 MB' })
      return
    }
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      setValue(field, url)
    } catch {
      setError(field, { message: 'Upload failed. Try again.' })
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: FormValues) {
    await onSave({
      front_text: data.front_text || null,
      front_image_url: data.front_image_url || null,
      back_text: data.back_text || null,
      back_image_url: data.back_image_url || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3>{initial ? 'Edit card' : 'New card'}</h3>

      <fieldset>
        <legend>Front</legend>
        <label>Text</label>
        <textarea {...register('front_text')} rows={3} />
        {errors.front_text && <p role="alert">{errors.front_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('front_image_url')} placeholder="https://..." />
        <span> or </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload('front_image_url', file)
          }}
        />
        {errors.front_image_url && <p role="alert">{errors.front_image_url.message}</p>}
      </fieldset>

      <fieldset>
        <legend>Back</legend>
        <label>Text</label>
        <textarea {...register('back_text')} rows={3} />
        {errors.back_text && <p role="alert">{errors.back_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('back_image_url')} placeholder="https://..." />
        <span> or </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload('back_image_url', file)
          }}
        />
        {errors.back_image_url && <p role="alert">{errors.back_image_url.message}</p>}
      </fieldset>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
