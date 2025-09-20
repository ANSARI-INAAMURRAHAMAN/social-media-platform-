'use client'

import { useState, useEffect, useRef } from 'react'
import api, { getImageUrl } from '@/lib/api'

interface User {
  _id: string
  name?: string
  email: string
  username?: string
  avatar?: string
}

interface Story {
  _id: string
  user: User
  mediaType: 'image' | 'video'
  mediaUrl: string
  text?: string
  views: any[]
  createdAt: string
  expiresAt: string
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  onClose: () => void
  onStoryViewed?: (storyId: string) => void
}

export default function StoryViewer({ stories, initialIndex = 0, onClose, onStoryViewed }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  const currentStory = stories[currentIndex]
  const STORY_DURATION = 5000 // 5 seconds for images, video duration for videos

  // Mark story as viewed
  const markAsViewed = async (storyId: string) => {
    try {
      await api.post(`/stories/${storyId}/view`)
      onStoryViewed?.(storyId)
    } catch (error) {
      console.error('Error marking story as viewed:', error)
    }
  }

  // Start progress timer
  const startProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    const duration = currentStory.mediaType === 'video' && videoRef.current 
      ? videoRef.current.duration * 1000 
      : STORY_DURATION

    let elapsed = 0
    const increment = 50 // Update every 50ms

    progressInterval.current = setInterval(() => {
      if (!isPaused) {
        elapsed += increment
        const newProgress = Math.min((elapsed / duration) * 100, 100)
        setProgress(newProgress)

        if (newProgress >= 100) {
          nextStory()
        }
      }
    }, increment)
  }

  // Stop progress timer
  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }
  }

  // Reset progress
  const resetProgress = () => {
    setProgress(0)
    stopProgress()
  }

  // Next story
  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      resetProgress()
      setIsLoading(true)
    } else {
      onClose()
    }
  }

  // Previous story
  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      resetProgress()
      setIsLoading(true)
    }
  }

  // Handle media load
  const handleMediaLoad = () => {
    setIsLoading(false)
    startProgress()
    markAsViewed(currentStory._id)
  }

  // Handle video events
  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
    handleMediaLoad()
  }

  // Pause/Resume
  const togglePause = () => {
    setIsPaused(!isPaused)
    if (currentStory.mediaType === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevStory()
          break
        case 'ArrowRight':
        case ' ':
          nextStory()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex])

  // Reset when story changes
  useEffect(() => {
    resetProgress()
    setIsLoading(true)
  }, [currentIndex])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress()
    }
  }, [])

  if (!currentStory) return null

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const storyDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'just now'
    if (diffInHours === 1) return '1h ago'
    return `${diffInHours}h ago`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Story Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10 mt-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white p-0.5">
              {currentStory.user.avatar ? (
                <img 
                  src={getImageUrl(currentStory.user.avatar)}
                  alt={currentStory.user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {currentStory.user.name?.[0] || currentStory.user.email[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {currentStory.user.name || currentStory.user.email}
            </p>
            <p className="text-white text-opacity-70 text-xs">
              {formatTimeAgo(currentStory.createdAt)}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-white text-opacity-70 hover:text-opacity-100 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Media Content */}
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={togglePause}
        >
          {currentStory.mediaType === 'image' ? (
            <img
              src={getImageUrl(currentStory.mediaUrl)}
              alt="Story"
              className="max-w-full max-h-full object-contain"
              onLoad={handleMediaLoad}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <video
              ref={videoRef}
              src={getImageUrl(currentStory.mediaUrl)}
              className="max-w-full max-h-full object-contain"
              onLoadedData={handleVideoLoad}
              onEnded={nextStory}
              onError={() => setIsLoading(false)}
              muted
              playsInline
            />
          )}
        </div>

        {/* Story Text */}
        {currentStory.text && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-center text-sm bg-black bg-opacity-30 rounded-lg p-3">
              {currentStory.text}
            </p>
          </div>
        )}

        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          {/* Previous Story Area */}
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={prevStory}
          />
          
          {/* Pause/Play Area */}
          <div 
            className="w-1/3 h-full cursor-pointer flex items-center justify-center"
            onClick={togglePause}
          >
            {isPaused && (
              <div className="bg-black bg-opacity-50 rounded-full p-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Next Story Area */}
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={nextStory}
          />
        </div>
      </div>

      {/* Story Info */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-white text-opacity-70 text-xs">
          {currentIndex + 1} of {stories.length}
        </p>
      </div>
    </div>
  )
}
