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

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cards, setCards] = useState<AdminCard[]>([])
  const [tab, setTab] = useState<'users' | 'cards'>('users')
  const [apiError, setApiError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'user' },
  })

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(console.error)
    adminApi.getAdminCards().then(setCards).catch(console.error)
  }, [])

  async function handleAddUser(data: AddUserForm) {
    setApiError('')
    try {
      const newUser = await adminApi.createUser(data)
      setUsers((prev) => [...prev, newUser])
      reset()
      setShowAddUser(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      setApiError(msg)
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
                <form onSubmit={handleSubmit(handleAddUser)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label>Email</label>
                      <input {...register('email')} type="email" placeholder="user@example.com" />
                      {errors.email && <span style={{ color: '#ed4245', fontSize: 12 }}>{errors.email.message}</span>}
                    </div>
                    <div>
                      <label>Password</label>
                      <input {...register('password')} type="password" placeholder="Min 8 characters" />
                      {errors.password && <span style={{ color: '#ed4245', fontSize: 12 }}>{errors.password.message}</span>}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label>Role</label>
                    <select {...register('role')} style={{ width: 'auto', minWidth: 140 }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '8px 20px', fontSize: 13 }}>
                    {isSubmitting ? 'Creating…' : 'Create user'}
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
                    <th style={{ ...thStyle, width: 80 }}></th>
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
                      <td style={cellStyle}>
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
                    <th style={thStyle}>Created</th>
                    <th style={{ ...thStyle, width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id}>
                      <td style={cellStyle}>{c.front_text ?? <em style={{ color: '#72767d' }}>image</em>}</td>
                      <td style={cellStyle}>{c.back_text ?? <em style={{ color: '#72767d' }}>image</em>}</td>
                      <td style={{ ...cellStyle, color: '#b9bbbe' }}>{c.user_email}</td>
                      <td style={cellStyle}>{new Date(c.created_at).toLocaleDateString()}</td>
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
