'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import PostCard from '@/components/PostCard'

interface Post {
  _id: string
  content: string
  user: {
    _id: string
    name: string
    email: string
  }
  comments: any[]
  likes: any[]
  createdAt: string
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

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
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ))
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
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-gray-600 hover:text-instagram-blue"
            >
              {refreshing ? '🔄' : '↻'}
            </button>
            <Link href="/create" className="text-gray-600 hover:text-instagram-blue">
              ➕
            </Link>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-md mx-auto py-4">
        {error && (
          <div className="mx-4 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
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
            {posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onPostUpdate={handlePostUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-around">
            <Link href="/feed" className="flex flex-col items-center text-instagram-blue">
              <span className="text-xl">🏠</span>
              <span className="text-xs">Home</span>
            </Link>
            <button className="flex flex-col items-center text-gray-600 hover:text-instagram-blue">
              <span className="text-xl">🔍</span>
              <span className="text-xs">Search</span>
            </button>
            <Link href="/create" className="flex flex-col items-center text-gray-600 hover:text-instagram-blue">
              <span className="text-xl">➕</span>
              <span className="text-xs">Create</span>
            </Link>
            <button className="flex flex-col items-center text-gray-600 hover:text-instagram-blue">
              <span className="text-xl">❤️</span>
              <span className="text-xs">Activity</span>
            </button>
            <button className="flex flex-col items-center text-gray-600 hover:text-instagram-blue">
              <span className="text-xl">👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
