/**
 * Sign up page route
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signUp, authStore } from '@/store/authStore'

/**
 * Sign up form component
 */
function SignUpPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const success = signUp(formData.name, formData.email, formData.password)
    
    if (success) {
      // Check user role and redirect accordingly
      const user = authStore.currentUser
      if (user?.role === 'admin') {
        navigate({ to: '/dashboard' })
      } else {
        navigate({ to: '/products' })
      }
    } else {
      setError('Email already exists. Please sign in or use a different email.')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="card w-full max-w-md shadow-2xl bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold justify-center mb-4">
            Sign Up
          </h2>
          
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="input input-bordered"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Sign Up
              </button>
            </div>
          </form>

          <div className="divider">OR</div>
          
          <p className="text-center">
            Already have an account?{' '}
            <a href="/signin" className="link link-primary">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

