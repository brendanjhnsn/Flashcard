import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
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
      const res = await authApi.register(data.email, data.password)
      login(res.token, res.user)
      navigate('/cards')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'EMAIL_TAKEN') {
        setError('email', { message: 'Email already registered' })
      } else {
        setError('root', { message: 'Registration failed. Please try again.' })
      }
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1>Create account</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" {...register('password')} />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}
