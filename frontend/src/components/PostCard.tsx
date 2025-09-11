'use client'

import { useState, useEffect } from 'react'
import api, { getImageUrl } from '@/lib/api'

interface User {
  _id: string
  name?: string
  email: string
  username?: string
  avatar?: string
}

interface Comment {
  _id: string
  content: string
  user?: User
  createdAt: string
}

interface Post {
  _id: string
  content: string
  image?: string
  user?: User
  comments?: Comment[]
  likes?: any[]
  createdAt: string
}

interface PostCardProps {
  post: Post
  onPostUpdate?: (updatedPost: Post) => void
  onPostDelete?: (postId: string) => void
}

export default function PostCard({ post, onPostUpdate, onPostDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [comments, setComments] = useState(post.comments || [])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCommentDropdowns, setShowCommentDropdowns] = useState<{[key: string]: boolean}>({})
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Get current user from localStorage first, then try API
    const fetchCurrentUser = async () => {
      try {
        // Try localStorage first
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setCurrentUser(userData)
          return
        }

        // Fallback to API if no localStorage data
        const response = await api.get('/users/auth/status')
        if (response.data.success && response.data.authenticated) {
          setCurrentUser(response.data.user)
          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false)
      }
      // Close all comment dropdowns
      if (Object.keys(showCommentDropdowns).length > 0) {
        setShowCommentDropdowns({})
      }
    }

    if (showDropdown || Object.keys(showCommentDropdowns).length > 0) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown, showCommentDropdowns])

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      // Try the session-based endpoint first
      let response;
      try {
        response = await api.delete(`/posts/destroy/${post._id}`)
      } catch (sessionError) {
        console.log('Session-based delete failed, trying API v1:', sessionError)
        // If session-based fails, try API v1 endpoint
        response = await api.delete(`/api/v1/posts/${post._id}`)
      }
      
      if (response.data.success) {
        // Call parent callback to remove post from list
        if (onPostDelete) {
          onPostDelete(post._id)
        }
        alert('Post deleted successfully!')
      } else {
        throw new Error(response.data.message || 'Delete failed')
      }
    } catch (error: any) {
      console.error('Error deleting post:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete post'
      alert(`Failed to delete post: ${errorMessage}`)
    }
    setShowDropdown(false)
  }

  const handleLike = async () => {
    try {
      const response = await api.post(`/likes/toggle/?id=${post._id}&type=Post`)
      
      if (response.data.success) {
        setIsLiked(!isLiked)
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await api.post('/comments/create', {
        content: newComment.trim(),
        post: post._id
      })

      if (response.data.success) {
        const comment = response.data.data.comment
        setComments([...comments, comment])
        setNewComment('')
        
        // Update parent component if callback provided
        if (onPostUpdate) {
          onPostUpdate({
            ...post,
            comments: [...comments, comment]
          })
        }
      }
    } catch (error: any) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await api.delete(`/comments/destroy/${commentId}`)
      
      if (response.data.success) {
        // Remove comment from local state
        const updatedComments = comments.filter(comment => comment._id !== commentId)
        setComments(updatedComments)
        
        // Close the dropdown
        setShowCommentDropdowns(prev => ({
          ...prev,
          [commentId]: false
        }))
        
        // Update parent component if callback provided
        if (onPostUpdate) {
          onPostUpdate({
            ...post,
            comments: updatedComments
          })
        }
        
        alert('Comment deleted successfully!')
      } else {
        throw new Error(response.data.message || 'Delete failed')
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete comment'
      alert(`Failed to delete comment: ${errorMessage}`)
    }
  }

  const toggleCommentDropdown = (commentId: string) => {
    setShowCommentDropdowns(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    if (!mounted) return 'Loading...' // Prevent hydration mismatch
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="card mb-4">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
            {post.user?.name?.[0]?.toUpperCase() || post.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.user?.name || post.user?.email || 'Unknown User'}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-gray-600 p-2"
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
            >
              ⋯
            </button>
            {showDropdown && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Show delete option if user owns the post */}
                {currentUser && (currentUser.id === post.user?._id || currentUser._id === post.user?._id) && (
                  <button
                    onClick={handleDeletePost}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete Post
                  </button>
                )}
                
                {/* Debug info for troubleshooting */}
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Current User: {currentUser ? `${currentUser.name || 'No name'} (${currentUser.id || currentUser._id || 'No ID'})` : 'Not logged in'}
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Post User: {post.user?.name || 'No name'} ({post.user?._id || 'No ID'})
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Match: {currentUser && (currentUser.id === post.user?._id || currentUser._id === post.user?._id) ? 'YES' : 'NO'}
                </div>
                
                <button
                  onClick={() => setShowDropdown(false)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        
        {/* Post Image */}
        {post.image && (
          <div className="mt-3">
            <img
              src={getImageUrl(post.image)}
              alt="Post content"
              className="w-full rounded-lg object-cover max-h-96"
              onError={(e) => {
                console.error('Error loading image:', post.image)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 pb-2">
        <div className="flex items-center space-x-4 mb-2">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
          >
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-600 hover:text-instagram-blue transition-colors"
          >
            <span className="text-lg">💬</span>
          </button>
          
          <button className="flex items-center space-x-1 text-gray-600 hover:text-instagram-blue transition-colors">
            <span className="text-lg">📤</span>
          </button>
        </div>

        {/* Likes Count */}
        {likesCount > 0 && (
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Comments Preview */}
        {comments.length > 0 && !showComments && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            View all {comments.length} comments
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          {/* Existing Comments */}
          <div className="max-h-60 overflow-y-auto">
            {comments.filter(comment => comment && comment._id && comment.content).map((comment) => (
              <div key={comment._id} className="p-4 border-b border-gray-50 last:border-b-0">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {comment.user?.name?.[0]?.toUpperCase() || comment.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{comment.user?.name || comment.user?.email || 'Unknown User'}</p>
                          <p className="text-sm text-gray-900">{comment.content}</p>
                        </div>
                        {/* Three dots menu for comment owner */}
                        {currentUser && (currentUser.id === comment.user?._id || currentUser._id === comment.user?._id) && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCommentDropdown(comment._id)
                              }}
                              className="text-gray-400 hover:text-gray-600 ml-2 p-1 transition-colors"
                              title="Comment options"
                            >
                              <span className="text-xs">⋯</span>
                            </button>
                            {showCommentDropdowns[comment._id] && (
                              <div 
                                className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-20 border"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md"
                                >
                                  Delete Comment
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(comment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="p-4 bg-gray-50">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                U
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue focus:border-transparent"
                  disabled={isSubmittingComment}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-instagram-blue text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  {isSubmittingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
