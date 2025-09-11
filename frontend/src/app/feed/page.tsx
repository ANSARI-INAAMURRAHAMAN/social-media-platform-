'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import PostCard from '@/components/PostCard'
import BottomNavigation from '@/components/BottomNavigation'
import FollowButton from '@/components/FollowButton'
import StoriesFeed from '@/components/StoriesFeed'
import StoryCreate from '@/components/StoryCreate'
import { useSearchParams } from 'next/navigation'

interface Post {
  _id: string
  content: string
  image?: string
  user?: {
    _id: string
    name?: string
    email: string
  }
  comments?: any[]
  likes?: any[]
  createdAt: string
}

interface SuggestedUser {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
  isFollowing?: boolean
  followersCount?: number
}

function FeedContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showStoryCreate, setShowStoryCreate] = useState(false)
  const searchParams = useSearchParams()

  // Get current user ID from token
  const getCurrentUserId = (): string | null => {
    if (typeof window === 'undefined') return null
    
    const token = localStorage.getItem('authToken')
    if (!token) return null
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload._id || null
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only check URL params after component is mounted on client
    if (mounted) {
      const authSuccess = searchParams.get('auth')
      const userParam = searchParams.get('user')
      const tokenParam = searchParams.get('token')
      
      if (authSuccess === 'success') {
        setSuccessMessage('Successfully logged in with Google!')
        
        // Store JWT token if provided
        if (tokenParam) {
          localStorage.setItem('authToken', tokenParam)
          console.log('JWT token stored from Google OAuth')
        }
        
        // Store user data in localStorage if provided
        if (userParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userParam))
            localStorage.setItem('user', JSON.stringify(userData))
            console.log('User data stored:', userData)
          } catch (error) {
            console.error('Error parsing user data:', error)
          }
        }
        
        // Clear the message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    }
    
    fetchPosts()
    fetchSuggestedUsers()
  }, [mounted, searchParams])

  const handleStoryCreated = () => {
    // Refresh stories feed - the StoriesFeed component will handle this
    // Could also trigger a refresh of the stories data here
  }

  const fetchSuggestedUsers = async () => {
    try {
      const response = await api.get('/discover/suggested?limit=3')
      if (response.data.success) {
        setSuggestedUsers(response.data.data.users)
      }
    } catch (error: any) {
      console.error('Error fetching suggested users:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await api.get('/')
      if (response.data.success) {
        setPosts(response.data.data.posts)
      }
    } catch (error: any) {
      setError('Failed to load posts')
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchPosts()
    fetchSuggestedUsers()
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ))
  }

  const handlePostDelete = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-instagram-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-instagram-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Instagram
          </h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowStoryCreate(true)}
              className="text-gray-600 hover:text-blue-500 transition-colors"
              title="Add Story"
            >
              📷
            </button>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-gray-600 hover:text-instagram-blue"
            >
              {refreshing ? '🔄' : '↻'}
            </button>
            <Link href="/discover" className="text-gray-600 hover:text-instagram-blue">
              🔍
            </Link>
            <Link href="/create" className="text-gray-600 hover:text-instagram-blue">
              ➕
            </Link>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-md mx-auto">
        {/* Stories Section */}
        <StoriesFeed currentUserId={getCurrentUserId() || undefined} />
        
        <div className="py-4">
        {successMessage && (
          <div className="mx-4 mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
            <button 
              onClick={() => setSuccessMessage('')}
              className="float-right text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="mx-4 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12 mx-4">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">
              Start sharing your moments with friends!
            </p>
            <Link href="/create" className="btn-primary inline-block">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="px-4">
            {/* Suggested Users Section */}
            {suggestedUsers.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">People you may know</h3>
                  <Link href="/discover" className="text-sm text-instagram-blue hover:underline">
                    See all
                  </Link>
                </div>
                <div className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link href={`/profile/${user._id}`}>
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-105 transition-transform">
                            {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
                          </div>
                        </Link>
                        <div>
                          <Link href={`/profile/${user._id}`}>
                            <p className="font-medium text-gray-900 hover:text-instagram-blue cursor-pointer">
                              {user.name || 'Unknown User'}
                            </p>
                          </Link>
                          <p className="text-xs text-gray-500">
                            {user.followersCount || 0} followers
                          </p>
                        </div>
                      </div>
                      <FollowButton 
                        userId={user._id}
                        initialIsFollowing={user.isFollowing}
                        className="text-xs px-3 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Story Create Modal */}
      {showStoryCreate && (
        <StoryCreate
          onStoryCreated={() => {
            handleStoryCreated()
            setShowStoryCreate(false)
          }}
          onClose={() => setShowStoryCreate(false)}
        />
      )}
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <FeedContent />
    </Suspense>
  )
}
