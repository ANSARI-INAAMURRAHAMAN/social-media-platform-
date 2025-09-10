'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import BottomNavigation from '@/components/BottomNavigation'
import { useRouter } from 'next/navigation'

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!content.trim()) {
      setError('Please write something for your post')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.post('/posts/create', {
        content: content.trim()
      })

      if (response.data.success) {
        setSuccess('Post created successfully!')
        setContent('')
        // Redirect to feed after 2 seconds
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
      } else {
        setError(response.data.message || 'Failed to create post')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Please log in to create a post')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(error.response?.data?.message || 'Failed to create post. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-instagram-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-instagram-blue">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">New Post</h1>
          <div className="w-12"></div> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="card p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's on your mind?
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write something..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-instagram-blue focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {content.length}/500
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Share Post'}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Tips for a great post:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share what you're thinking or feeling</li>
            <li>• Ask questions to engage your friends</li>
            <li>• Keep it authentic and genuine</li>
          </ul>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
