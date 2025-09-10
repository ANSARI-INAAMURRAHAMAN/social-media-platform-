'use client'

import { useState } from 'react'
import api from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
}

interface Comment {
  _id: string
  content: string
  user: User
  createdAt: string
}

interface Post {
  _id: string
  content: string
  user: User
  comments: Comment[]
  likes: any[]
  createdAt: string
}

interface PostCardProps {
  post: Post
  onPostUpdate?: (updatedPost: Post) => void
}

export default function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comments, setComments] = useState(post.comments)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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

  const formatTimeAgo = (dateString: string) => {
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
            {post.user.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.user.name}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            ⋯
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
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
            {comments.map((comment) => (
              <div key={comment._id} className="p-4 border-b border-gray-50 last:border-b-0">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {comment.user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm">{comment.user.name}</p>
                      <p className="text-sm text-gray-900">{comment.content}</p>
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
