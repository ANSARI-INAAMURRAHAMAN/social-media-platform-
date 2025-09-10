'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import PostCard from '@/components/PostCard'
import BottomNavigation from '@/components/BottomNavigation'
import UserList from '@/components/UserList'

interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
  followersCount?: number
  followingCount?: number
}

interface Post {
  _id: string
  content: string
  user: User
  comments: any[]
  likes: any[]
  createdAt: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'followers' | 'following'>('posts')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      // First get user info
      const userResponse = await api.get('/users/profile')
      if (userResponse.data.success) {
        setUser(userResponse.data.data.user)
      }

      // Then get user's posts
      const postsResponse = await api.get('/api/v1/posts')
      if (postsResponse.data.success) {
        // Filter posts by current user
        const userPosts = postsResponse.data.data.posts.filter(
          (post: Post) => post.user._id === userResponse.data.data.user._id
        )
        setPosts(userPosts)
      }
    } catch (error: any) {
      setError('Failed to load profile')
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/users/destroy-session')
      localStorage.removeItem('authToken')
      window.location.href = '/auth/login'
    } catch (error) {
      // Even if the API call fails, we should still log out locally
      localStorage.removeItem('authToken')
      window.location.href = '/auth/login'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-instagram-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-instagram-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-instagram-blue">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">{user.name || 'Profile'}</h1>
          <button 
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-500 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto p-6">
          <div className="flex items-center space-x-4 mb-4">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
            </div>
            
            {/* Stats */}
            <div className="flex-1">
              <div className="flex justify-around text-center">
                <div>
                  <div className="font-semibold text-lg">{posts.length}</div>
                  <div className="text-gray-600 text-sm">Posts</div>
                </div>
                <div className="cursor-pointer hover:opacity-75" onClick={() => setActiveTab('followers')}>
                  <div className="font-semibold text-lg">{user.followersCount || 0}</div>
                  <div className="text-gray-600 text-sm">Followers</div>
                </div>
                <div className="cursor-pointer hover:opacity-75" onClick={() => setActiveTab('following')}>
                  <div className="font-semibold text-lg">{user.followingCount || 0}</div>
                  <div className="text-gray-600 text-sm">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h2 className="font-semibold text-lg">{user.name || 'Unknown User'}</h2>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Link href="/profile/edit" className="flex-1">
              <button className="w-full btn-secondary text-sm">
                Edit Profile
              </button>
            </Link>
            <button className="flex-1 btn-secondary text-sm">
              Share Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-center text-xs font-medium border-b-2 ${
                activeTab === 'posts'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              📱 POSTS
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-3 text-center text-xs font-medium border-b-2 ${
                activeTab === 'followers'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              👥 FOLLOWERS
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-3 text-center text-xs font-medium border-b-2 ${
                activeTab === 'following'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              👤 FOLLOWING
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-3 text-center text-xs font-medium border-b-2 ${
                activeTab === 'about'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              ℹ️ ABOUT
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-md mx-auto py-4">
        {activeTab === 'posts' ? (
          <div className="px-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">
                  Share your first moment!
                </p>
                <Link href="/create" className="btn-primary">
                  Create Post
                </Link>
              </div>
            ) : (
              <div>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'followers' ? (
          <div className="px-4">
            <UserList userId={user._id} type="followers" />
          </div>
        ) : activeTab === 'following' ? (
          <div className="px-4">
            <UserList userId={user._id} type="following" />
          </div>
        ) : (
          <div className="px-4">
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{user.name || 'No name set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Member since</label>
                  <p className="text-gray-900">Recently joined</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
