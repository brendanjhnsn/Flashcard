// Separate fetch for multipart — can't use the JSON wrapper here
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error?.message ?? 'Upload failed'), {
      code: body?.error?.code,
      status: res.status,
    })
  }
  return res.json()
}
