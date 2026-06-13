// Base fetch wrapper — attaches the JWT from localStorage if present
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error?.message ?? 'Request failed'), {
      code: body?.error?.code,
      status: res.status,
    })
  }

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json()
}
