'use client'

import { useState, useEffect } from 'react'
import api, { getImageUrl } from '@/lib/api'
import StoryViewer from './StoryViewer'
import StoryCreate from './StoryCreate'

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

interface StoryGroup {
  user: User
  stories: Story[]
}

interface StoriesFeedProps {
  currentUserId?: string
}

export default function StoriesFeed({ currentUserId }: StoriesFeedProps) {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStories, setSelectedStories] = useState<Story[] | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch stories from API
  const fetchStories = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/stories/')
      
      if (response.data.success) {
        setStoryGroups(response.data.data.storiesByUser || [])
      }
    } catch (error: any) {
      console.error('Error fetching stories:', error)
      setError('Failed to load stories')
    } finally {
      setIsLoading(false)
    }
  }

  // Load stories on component mount
  useEffect(() => {
    fetchStories()
  }, [])

  // Handle story group click
  const handleStoryClick = (stories: Story[], index: number = 0) => {
    setSelectedStories(stories)
    setSelectedIndex(index)
  }

  // Handle story creation
  const handleStoryCreated = () => {
    fetchStories() // Refresh stories after creation
  }

  // Check if user has viewed all stories in a group
  const hasViewedAllStories = (stories: Story[]) => {
    if (!currentUserId) return false
    return stories.every(story => 
      story.views.some(view => view.user === currentUserId)
    )
  }

  // Get current user's stories
  const currentUserStories = storyGroups.find(group => group.user._id === currentUserId)

  if (isLoading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {/* Loading skeletons */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-1"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={fetchStories}
            className="text-red-700 underline text-sm mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Add Story Button (Your Story) */}
          <div className="flex-shrink-0 text-center">
            {currentUserStories ? (
              // User has stories - show them with add option
              <div className="relative">
                <button
                  onClick={() => handleStoryClick(currentUserStories.stories)}
                  className="relative"
                >
                  <div className={`w-16 h-16 rounded-full p-0.5 ${
                    hasViewedAllStories(currentUserStories.stories)
                      ? 'bg-gray-300'
                      : 'bg-gradient-to-r from-pink-500 to-orange-500'
                  }`}>
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      {currentUserStories.user.avatar ? (
                        <img 
                          src={getImageUrl(currentUserStories.user.avatar)}
                          alt="Your story"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {currentUserStories.user.name?.[0] || currentUserStories.user.email[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Story count indicator */}
                  {currentUserStories.stories.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {currentUserStories.stories.length}
                    </div>
                  )}
                </button>
                
                {/* Add button overlay */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                  title="Add another story"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <p className="text-xs mt-1 text-gray-900 truncate w-16">Your story</p>
              </div>
            ) : (
              // User has no stories - show add button
              <button
                onClick={() => setShowCreateModal(true)}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-xs mt-1 text-gray-600 truncate w-16">Your story</p>
              </button>
            )}
          </div>

          {/* Other Users' Stories */}
          {storyGroups
            .filter(group => group.user._id !== currentUserId)
            .map((group) => (
              <div key={group.user._id} className="flex-shrink-0 text-center">
                <button
                  onClick={() => handleStoryClick(group.stories)}
                  className="relative"
                >
                  <div className={`w-16 h-16 rounded-full p-0.5 ${
                    hasViewedAllStories(group.stories)
                      ? 'bg-gray-300'
                      : 'bg-gradient-to-r from-pink-500 to-orange-500'
                  }`}>
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      {group.user.avatar ? (
                        <img 
                          src={getImageUrl(group.user.avatar)}
                          alt={group.user.name || group.user.email}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {group.user.name?.[0] || group.user.email[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Story count indicator */}
                  {group.stories.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {group.stories.length}
                    </div>
                  )}
                </button>
                
                <p className="text-xs mt-1 text-gray-900 truncate w-16">
                  {group.user.name?.split(' ')[0] || group.user.email.split('@')[0]}
                </p>
              </div>
            ))}

          {/* Empty state if no stories */}
          {storyGroups.length === 0 && (
            <div className="flex-shrink-0 text-center py-8">
              <p className="text-gray-500 text-sm">No stories to show</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="text-blue-500 text-sm underline mt-1"
              >
                Share your first story
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStories && (
        <StoryViewer
          stories={selectedStories}
          initialIndex={selectedIndex}
          onClose={() => {
            setSelectedStories(null)
            setSelectedIndex(0)
          }}
          onStoryViewed={() => {
            // Optionally refresh stories to update view status
            // fetchStories()
          }}
        />
      )}

      {/* Story Create Modal */}
      {showCreateModal && (
        <StoryCreate
          onStoryCreated={handleStoryCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}
