'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StoriesFeed from '@/components/StoriesFeed'
import BottomNavigation from '@/components/BottomNavigation'

export default function StoriesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get current user from token or API call
    // For now, we'll decode the JWT client-side (in production, use a proper JWT library)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setCurrentUserId(payload._id)
    } catch (error) {
      console.error('Error decoding token:', error)
      router.push('/auth/login')
    }
  }, [router])

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">Stories</h1>
          
          <div className="w-6 h-6"></div> {/* Spacer */}
        </div>
      </div>

      {/* Stories Feed */}
      <div className="max-w-md mx-auto">
        <StoriesFeed currentUserId={currentUserId} />
        
        {/* Additional Stories Features */}
        <div className="p-4 space-y-4">
          {/* Stories Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📱 Stories Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stories disappear after 24 hours</li>
              <li>• Tap to pause, swipe to navigate</li>
              <li>• Only followers can see your stories</li>
              <li>• Videos up to 50MB, images up to 10MB</li>
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Recent Story Activity</h3>
            <p className="text-sm text-gray-500 text-center py-8">
              Story views and interactions will appear here
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
