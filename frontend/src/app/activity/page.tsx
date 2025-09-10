'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import BottomNavigation from '@/components/BottomNavigation'

interface Activity {
  _id: string
  type: 'like' | 'comment' | 'follow'
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  post?: {
    _id: string
    content: string
  }
  comment?: {
    _id: string
    content: string
  }
  createdAt: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'you' | 'following'>('you')

  useEffect(() => {
    fetchActivities()
  }, [activeTab])

  const fetchActivities = async () => {
    setIsLoading(true)
    setError('')

    try {
      const user = localStorage.getItem('user')
      if (!user) {
        setError('Please log in to view activities')
        setIsLoading(false)
        return
      }

      const response = await fetch('http://localhost:8000/activity', {
        headers: {
          'Authorization': `Bearer ${JSON.parse(user).token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        setActivities(data.data.activities || [])
      } else {
        setError(data.message || 'Failed to load activities')
      }
    } catch (error: any) {
      console.error('Failed to load activities:', error)
      setError('Failed to load activities. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 604800)}w`
  }

  const renderActivityItem = (activity: Activity) => {
    const { user } = activity
    
    return (
      <div key={activity._id} className="flex items-start space-x-3 p-4 hover:bg-gray-50">
        <Link href={`/profile/${user._id}`}>
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
            {user.avatar ? (
              <img 
                src={`http://localhost:8000${user.avatar}`} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <Link href={`/profile/${user._id}`} className="font-semibold text-gray-900 hover:underline">
              {user.name}
            </Link>
            <span className="text-gray-600">
              {activity.type === 'like' && 'liked your post'}
              {activity.type === 'comment' && 'commented on your post'}
              {activity.type === 'follow' && 'started following you'}
            </span>
            <span className="text-gray-400 text-sm">
              {formatTimeAgo(activity.createdAt)}
            </span>
          </div>
          
          {activity.post && (
            <Link href={`/post/${activity.post._id}`} className="text-gray-600 text-sm hover:underline mt-1 block">
              "{activity.post.content.substring(0, 50)}..."
            </Link>
          )}
          
          {activity.comment && (
            <p className="text-gray-600 text-sm mt-1">
              "{activity.comment.content.substring(0, 50)}..."
            </p>
          )}
        </div>
        
        {activity.type === 'like' && (
          <div className="text-red-500">❤️</div>
        )}
        {activity.type === 'comment' && (
          <div className="text-blue-500">💬</div>
        )}
        {activity.type === 'follow' && (
          <button className="px-4 py-2 bg-instagram-blue text-white text-sm rounded-lg hover:bg-blue-600">
            Follow back
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-instagram-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Activity</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('you')}
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'you'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              You
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'following'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        {error && (
          <div className="mx-4 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instagram-blue mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">
              {activeTab === 'you' ? '❤️' : '👥'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'you' ? 'No activity yet' : 'No activity from people you follow'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'you' 
                ? 'When people like and comment on your posts, you\'ll see it here.'
                : 'Activity from people you follow will appear here.'
              }
            </p>
            <Link href="/search" className="btn-primary inline-block">
              Discover people
            </Link>
          </div>
        ) : (
          <div className="bg-white">
            {activities.map(renderActivityItem)}
          </div>
        )}
      </div>

      {/* Coming Soon Notice */}
      <div className="mx-4 mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-500">ℹ️</span>
          <div>
            <h4 className="font-semibold text-blue-900">Coming Soon!</h4>
            <p className="text-blue-700 text-sm">
              Activity tracking for likes, comments, and follows will be implemented with backend APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
