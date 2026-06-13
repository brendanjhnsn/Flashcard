import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormValues) {
    try {
      const res = await authApi.login(data.email, data.password)
      login(res.token, res.user)
      navigate('/cards')
    } catch {
      setError('root', { message: 'Invalid email or password' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#202225' }}>
      <div style={{ width: '100%', maxWidth: 440, backgroundColor: '#36393f', borderRadius: 8, padding: '32px 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Welcome back!</h1>
        <p style={{ textAlign: 'center', color: '#b9bbbe', marginBottom: 24, fontSize: 14 }}>
          We're so excited to see you again!
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p role="alert">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p role="alert">{errors.password.message}</p>}
          </div>
          {errors.root && <p role="alert" style={{ marginTop: 8 }}>{errors.root.message}</p>}
          <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: 20, padding: '12px' }}>
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: '#72767d' }}>
          Need an account?{' '}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
