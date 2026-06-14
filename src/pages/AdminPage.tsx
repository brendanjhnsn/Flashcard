import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as adminApi from '../api/admin'
import type { AdminUser, AdminCard } from '../api/admin'

const addUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']),
})
type AddUserForm = z.infer<typeof addUserSchema>

const editUserSchema = z
  .object({
    role: z.enum(['user', 'admin']),
    password: z.string().max(72).optional().or(z.literal('')),
  })
  .transform((d) => ({
    role: d.role,
    password: d.password && d.password.length > 0 ? d.password : undefined,
  }))
  .refine((d) => d.password === undefined || d.password.length >= 8, {
    message: 'Password must be at least 8 characters',
    path: ['password'],
  })
type EditUserForm = { role: 'user' | 'admin'; password?: string }

const cellStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #202225',
  color: '#dcddde',
  fontSize: 13,
}

const thStyle: React.CSSProperties = {
  ...cellStyle,
  color: '#b9bbbe',
  fontWeight: 600,
  backgroundColor: '#202225',
  textAlign: 'left',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cards, setCards] = useState<AdminCard[]>([])
  const [tab, setTab] = useState<'users' | 'cards'>('users')
  const [apiError, setApiError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editError, setEditError] = useState('')

  const addForm = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'user' },
  })

  const editForm = useForm<{ role: 'user' | 'admin'; password: string }>({
    resolver: zodResolver(editUserSchema),
  })

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(console.error)
    adminApi.getAdminCards().then(setCards).catch(console.error)
  }, [])

  function openEdit(u: AdminUser) {
    setEditingUser(u)
    setEditError('')
    editForm.reset({ role: u.role, password: '' })
  }

  function closeEdit() {
    setEditingUser(null)
    setEditError('')
    editForm.reset()
  }

  async function handleAddUser(data: AddUserForm) {
    setApiError('')
    try {
      const newUser = await adminApi.createUser(data)
      setUsers((prev) => [...prev, newUser])
      addForm.reset()
      setShowAddUser(false)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  async function handleEditUser(raw: { role: 'user' | 'admin'; password: string }) {
    if (!editingUser) return
    setEditError('')

    const body: EditUserForm = { role: raw.role }
    if (raw.password && raw.password.length > 0) body.password = raw.password

    try {
      const updated = await adminApi.updateUser(editingUser.id, body)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      closeEdit()
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  async function handleDeleteUser(id: number, email: string) {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  async function handleToggleCardPublic(id: number, currentValue: number) {
    try {
      const updated = await adminApi.updateAdminCard(id, { is_public: !currentValue })
      setCards((prev) => prev.map((c) => (c.id === updated.id ? { ...c, is_public: updated.is_public } : c)))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update card')
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('Delete this card? This cannot be undone.')) return
    try {
      await adminApi.deleteAdminCard(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete card')
    }
  }

  const tabBtn = (t: 'users' | 'cards'): React.CSSProperties => ({
    padding: '8px 20px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: tab === t ? '#5865f2' : 'transparent',
    color: tab === t ? '#fff' : '#b9bbbe',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#36393f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2f3136', borderBottom: '1px solid #202225', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Admin Panel</h1>
        </div>
        <Link to="/cards" style={{ color: '#b9bbbe', fontSize: 13, textDecoration: 'none' }}>
          ← Back to cards
        </Link>
      </div>

      {/* Edit user modal */}
      {editingUser && (
        <div style={overlayStyle} onClick={closeEdit}>
          <div
            style={{ backgroundColor: '#2f3136', borderRadius: 8, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1rem' }}>Edit User</h3>
            <p style={{ margin: '0 0 20px', color: '#b9bbbe', fontSize: 13 }}>{editingUser.email}</p>

            {editError && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>{editError}</div>
            )}

            <form onSubmit={editForm.handleSubmit(handleEditUser)}>
              <div style={{ marginBottom: 16 }}>
                <label>Role</label>
                <select {...editForm.register('role')} style={{ width: '100%' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label>New Password <span style={{ color: '#72767d', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                <input
                  {...editForm.register('password')}
                  type="password"
                  placeholder="Min 8 characters"
                />
                {editForm.formState.errors.password && (
                  <span style={{ color: '#ed4245', fontSize: 12 }}>
                    {editForm.formState.errors.password.message}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="ghost" onClick={closeEdit} style={{ padding: '8px 18px', fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={editForm.formState.isSubmitting} style={{ padding: '8px 18px', fontSize: 13 }}>
                  {editForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: '#2f3136', padding: 4, borderRadius: 6, width: 'fit-content' }}>
          <button style={tabBtn('users')} onClick={() => setTab('users')}>
            Users ({users.length})
          </button>
          <button style={tabBtn('cards')} onClick={() => setTab('cards')}>
            Cards ({cards.length})
          </button>
        </div>

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>All Users</h2>
              <button onClick={() => { setShowAddUser(!showAddUser); setApiError('') }} style={{ padding: '8px 16px', fontSize: 13 }}>
                {showAddUser ? 'Cancel' : '+ Add user'}
              </button>
            </div>

            {showAddUser && (
              <div style={{ backgroundColor: '#2f3136', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '0.95rem' }}>Add New User</h3>
                {apiError && (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>{apiError}</div>
                )}
                <form onSubmit={addForm.handleSubmit(handleAddUser)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label>Email</label>
                      <input {...addForm.register('email')} type="email" placeholder="user@example.com" />
                      {addForm.formState.errors.email && <span style={{ color: '#ed4245', fontSize: 12 }}>{addForm.formState.errors.email.message}</span>}
                    </div>
                    <div>
                      <label>Password</label>
                      <input {...addForm.register('password')} type="password" placeholder="Min 8 characters" />
                      {addForm.formState.errors.password && <span style={{ color: '#ed4245', fontSize: 12 }}>{addForm.formState.errors.password.message}</span>}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label>Role</label>
                    <select {...addForm.register('role')} style={{ width: 'auto', minWidth: 140 }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" disabled={addForm.formState.isSubmitting} style={{ padding: '8px 20px', fontSize: 13 }}>
                    {addForm.formState.isSubmitting ? 'Creating…' : 'Create user'}
                  </button>
                </form>
              </div>
            )}

            <div style={{ backgroundColor: '#2f3136', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Joined</th>
                    <th style={{ ...thStyle, width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={cellStyle}>{u.email}</td>
                      <td style={cellStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: u.role === 'admin' ? '#5865f2' : '#40444b',
                          color: '#fff',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={cellStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ ...cellStyle, display: 'flex', gap: 6 }}>
                        <button
                          className="ghost"
                          onClick={() => openEdit(u)}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          Edit
                        </button>
                        <button
                          className="ghost"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          style={{ padding: '4px 10px', fontSize: 12, color: '#ed4245' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#72767d' }}>No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Cards tab ── */}
        {tab === 'cards' && (
          <div>
            <h2 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1rem' }}>All Cards</h2>
            <div style={{ backgroundColor: '#2f3136', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Front</th>
                    <th style={thStyle}>Back</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Visibility</th>
                    <th style={{ ...thStyle, width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id}>
                      <td style={cellStyle}>{c.front_text ?? <em style={{ color: '#72767d' }}>image</em>}</td>
                      <td style={cellStyle}>{c.back_text ?? <em style={{ color: '#72767d' }}>image</em>}</td>
                      <td style={{ ...cellStyle, color: '#b9bbbe' }}>{c.user_email}</td>
                      <td style={cellStyle}>
                        <button
                          className="ghost"
                          onClick={() => handleToggleCardPublic(c.id, c.is_public)}
                          style={{
                            padding: '3px 10px',
                            fontSize: 12,
                            color: c.is_public ? '#3ba55d' : '#72767d',
                            border: `1px solid ${c.is_public ? '#3ba55d' : '#40444b'}`,
                          }}
                        >
                          {c.is_public ? 'Public' : 'Private'}
                        </button>
                      </td>
                      <td style={cellStyle}>
                        <button
                          className="ghost"
                          onClick={() => handleDeleteCard(c.id)}
                          style={{ padding: '4px 10px', fontSize: 12, color: '#ed4245' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#72767d' }}>No cards found</td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
