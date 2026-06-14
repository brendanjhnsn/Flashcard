import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import type { Card, CardBody } from '../api/cards'
import { uploadImage } from '../api/uploads'

// Mirror the server-side constraint: each side needs at least text or an image URL
const imageUrlField = z
  .string()
  .refine((v) => v === '' || v.startsWith('/uploads/') || (() => { try { new URL(v); return true } catch { return false } })(), {
    message: 'Enter a valid URL',
  })
  .optional()

const schema = z
  .object({
    front_text: z.string().max(10_000).optional(),
    front_image_url: imageUrlField,
    back_text: z.string().max(10_000).optional(),
    back_image_url: imageUrlField,
    is_public: z.boolean().optional(),
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
      is_public: initial ? !!initial.is_public : false,
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
      is_public: data.is_public ?? false,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 style={{ margin: '0 0 16px', color: '#fff' }}>{initial ? 'Edit card' : 'New card'}</h3>

      <fieldset>
        <legend>Front</legend>
        <label>Text</label>
        <textarea {...register('front_text')} rows={3} placeholder="Question or prompt…" />
        {errors.front_text && <p role="alert">{errors.front_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('front_image_url')} placeholder="https://…" />
        <div style={{ marginTop: 6, color: '#72767d', fontSize: 12 }}>
          — or upload —
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ marginTop: 6 }}
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
        <textarea {...register('back_text')} rows={3} placeholder="Answer or definition…" />
        {errors.back_text && <p role="alert">{errors.back_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('back_image_url')} placeholder="https://…" />
        <div style={{ marginTop: 6, color: '#72767d', fontSize: 12 }}>
          — or upload —
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ marginTop: 6 }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload('back_image_url', file)
          }}
        />
        {errors.back_image_url && <p role="alert">{errors.back_image_url.message}</p>}
      </fieldset>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 4 }}>
        <input
          type="checkbox"
          id="is_public"
          {...register('is_public')}
          style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
        />
        <label htmlFor="is_public" style={{ margin: 0, cursor: 'pointer', fontSize: 14 }}>
          Make this card public (visible without login)
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? 'Saving…' : uploading ? 'Uploading…' : 'Save'}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
