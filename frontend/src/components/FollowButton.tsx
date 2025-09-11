'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface FollowButtonProps {
  userId: string
  initialIsFollowing?: boolean
  onFollowChange?: (isFollowing: boolean, newFollowersCount: number) => void
  className?: string
  showChatButton?: boolean
}

export default function FollowButton({ 
  userId, 
  initialIsFollowing = false, 
  onFollowChange,
  className = '',
  showChatButton = false
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [followStatus, setFollowStatus] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchFollowStatus()
  }, [userId])

  const fetchFollowStatus = async () => {
    try {
      const response = await api.get(`/follow/status/${userId}`)
      if (response.data.success) {
        setFollowStatus(response.data.data)
        setIsFollowing(response.data.data.isFollowing)
      }
    } catch (error) {
      console.error('Error fetching follow status:', error)
    }
  }

  const handleToggleFollow = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const response = await api.post(`/follow/toggle/${userId}`)
      
      if (response.data.success) {
        const newIsFollowing = response.data.data.isFollowing
        setIsFollowing(newIsFollowing)
        
        // Update followStatus object for count calculations
        if (followStatus) {
          const newCount = newIsFollowing 
            ? followStatus.followersCount + 1 
            : followStatus.followersCount - 1
          
          setFollowStatus({
            ...followStatus,
            isFollowing: newIsFollowing,
            followersCount: newCount
          })
          
          // Notify parent component
          if (onFollowChange) {
            onFollowChange(newIsFollowing, newCount)
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error)
      alert(error.response?.data?.message || 'Failed to update follow status')
    } finally {
      setIsLoading(false)
    }
  }

  const startChat = async () => {
    try {
      const response = await api.post(`/chat/create/${userId}`)
      if (response.data.success) {
        router.push('/chat')
      }
    } catch (error: any) {
      console.error('Error creating chat:', error)
      alert(error.response?.data?.message || 'Failed to start chat')
    }
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md font-medium text-sm transition-colors
          ${isFollowing 
            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
            : 'bg-instagram-blue text-white hover:bg-blue-600'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      
      {showChatButton && isFollowing && (
        <button
          onClick={startChat}
          className={`
            px-4 py-2 rounded-md font-medium text-sm transition-colors
            bg-gray-100 text-gray-700 hover:bg-gray-200
            ${className}
          `}
          title="Start Chat"
        >
          💬
        </button>
      )}
    </div>
  )
}
