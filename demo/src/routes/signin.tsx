/**
 * Sign in page route
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { signIn, authStore } from '@/store/authStore'
import { useSnapshot } from 'valtio'
import { usersStore } from '@/store/usersStore'
import type { User } from '@/store/types'

/**
 * URL search parameters schema
 */
type SignInSearchParams = {
  email?: string
  password?: string
}

/**
 * User selection modal component
 */
function UserSelectionModal({
  isOpen,
  onClose,
  onSelectUser,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
}) {
  const { users } = useSnapshot(usersStore)

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Select a User to Sign In</h3>
        <p className="text-sm opacity-70 mb-4">
          Choose from existing demo users for quick testing
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              className="w-full text-left p-4 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
              onClick={() => {
                onSelectUser(user)
                onClose()
              }}
            >
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img src={user.avatar} alt={user.name} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{user.name}</div>
                  <div className="text-sm opacity-70">{user.email}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`badge ${
                      user.role === 'admin' ? 'badge-primary' : 'badge-ghost'
                    }`}
                  >
                    {user.role}
                  </span>
                  <div className="text-xs opacity-60 mt-1">
                    Password: test123
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

/**
 * Sign in form component
 */
function SignInPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [formData, setFormData] = useState({
    email: searchParams.email || '',
    password: searchParams.password || '',
  })
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Update form when URL params change
  useEffect(() => {
    if (searchParams.email) {
      setFormData(prev => ({ ...prev, email: searchParams.email || '' }))
    }
    if (searchParams.password) {
      setFormData(prev => ({ ...prev, password: searchParams.password || '' }))
    }
  }, [searchParams.email, searchParams.password])

  const handleSelectUser = (user: User) => {
    // Update URL params with selected user's email and test password
    navigate({
      to: '/signin',
      search: {
        email: user.email,
        password: 'test123',
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const success = signIn(formData.email, formData.password)
    
    if (success) {
      // Check user role and redirect accordingly
      const user = authStore.currentUser
      if (user?.role === 'admin') {
        navigate({ to: '/dashboard' })
      } else {
        navigate({ to: '/products' })
      }
    } else {
      setError('Email not found. Please check your email or sign up.')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="card w-full max-w-md shadow-2xl bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold justify-center mb-4">
            Sign In
          </h2>
          
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span
                  className="label-text cursor-pointer hover:text-primary flex items-center gap-2"
                  onClick={() => setIsModalOpen(true)}
                  title="Click to select from existing users"
                >
                  Email
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                  <span className="text-xs opacity-60">(click to select user)</span>
                </span>
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
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">
                  Forgot password?
                </a>
              </label>
            </div>

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Sign In
              </button>
            </div>
          </form>

          <div className="divider">OR</div>
          
          <p className="text-center">
            Don't have an account?{' '}
            <a href="/signup" className="link link-primary">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  )
}

export const Route = createFileRoute('/signin')({
  component: SignInPage,
  validateSearch: (search: Record<string, unknown>): SignInSearchParams => {
    return {
      email: search.email as string | undefined,
      password: search.password as string | undefined,
    }
  },
})

