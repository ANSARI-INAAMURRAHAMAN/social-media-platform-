'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import FollowButton from './FollowButton'

interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
}

interface UserListProps {
  userId: string
  type: 'followers' | 'following'
}

export default function UserList({ userId, type }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
    getCurrentUser()
  }, [userId, type])

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        setCurrentUser(response.data.data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const endpoint = type === 'followers' 
        ? `/follow/followers/${userId}` 
        : `/follow/following/${userId}`
      
      const response = await api.get(endpoint)
      if (response.data.success) {
        setUsers(response.data.data[type])
      }
    } catch (error: any) {
      setError('Failed to load users')
      console.error(`Error fetching ${type}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instagram-blue"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-2 text-instagram-blue hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {type} yet
        </h3>
        <p className="text-gray-600">
          {type === 'followers' 
            ? 'No one is following this user yet' 
            : 'This user is not following anyone yet'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user._id} className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
            </div>
            
            {/* User Info */}
            <div>
              <Link href={`/profile/${user._id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-instagram-blue">
                  {user.name || 'Unknown User'}
                </h3>
              </Link>
              <p className="text-sm text-gray-600">{user.username || user.email}</p>
            </div>
          </div>

          {/* Follow Button */}
          {currentUser && currentUser._id !== user._id && (
            <FollowButton 
              userId={user._id}
              className="text-xs px-3 py-1"
            />
          )}
        </div>
      ))}
    </div>
  )
}
