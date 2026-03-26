/**
 * Users list page route (Admin Only)
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { usersStore } from '@/store/usersStore'
import { RequireAdmin } from '@/lib/auth'

/**
 * Users list component showing all registered users (Admin Only)
 */
function UsersPage() {
  const { users } = useSnapshot(usersStore)

  return (
    <RequireAdmin>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Users Management</h1>
          <p className="text-lg mt-2">
            Manage and view all registered users (Admin Only)
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Link
            key={user.id}
            to="/users/$id"
            params={{ id: user.id }}
            className="card bg-base-200 hover:bg-base-300 transition-colors"
          >
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    <img src={user.avatar} alt={user.name} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="card-title text-lg">{user.name}</h3>
                  <p className="text-sm opacity-70">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm opacity-60 mt-2">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </RequireAdmin>
  )
}

export const Route = createFileRoute('/users')({
  component: UsersPage,
})

