/**
 * Individual user profile page route (Admin Only)
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { usersStore, getUserById } from '@/store/usersStore'
import { RequireAdmin } from '@/lib/auth'

/**
 * User profile component showing detailed user information (Admin Only)
 */
function UserProfilePage() {
  const { id } = Route.useParams()
  const { users } = useSnapshot(usersStore)
  const user = getUserById(id)

  if (!user) {
    return (
      <RequireAdmin>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
          <p className="mb-4">The user you're looking for doesn't exist.</p>
          <Link to="/users" className="btn btn-primary">
            Back to Users
          </Link>
        </div>
      </RequireAdmin>
    )
  }

  return (
    <RequireAdmin>
      <div>
      <div className="mb-6">
        <Link to="/users" className="btn btn-ghost btn-sm">
          ← Back to Users
        </Link>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="avatar">
              <div className="w-32 h-32 rounded-full">
                <img src={user.avatar} alt={user.name} />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <p className="text-xl opacity-70 mb-4">{user.email}</p>

              <div className="flex gap-2 mb-6">
                <span className={`badge badge-lg ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">Account Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="opacity-70">User ID:</span>
                      <span className="ml-2 font-mono">{user.id}</span>
                    </div>
                    <div>
                      <span className="opacity-70">Joined:</span>
                      <span className="ml-2">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {user.lastLogin && (
                      <div>
                        <span className="opacity-70">Last Login:</span>
                        <span className="ml-2">
                          {new Date(user.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <div className="stat bg-base-300 rounded-lg">
                      <div className="stat-title">Account Age</div>
                      <div className="stat-value text-2xl">
                        {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button className="btn btn-primary">Edit Profile</button>
                <button className="btn btn-ghost">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RequireAdmin>
  )
}

export const Route = createFileRoute('/users/$id')({
  component: UserProfilePage,
})

