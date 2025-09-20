'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api, { getImageUrl } from '@/lib/api'
import PostCard from '@/components/PostCard'
import BottomNavigation from '@/components/BottomNavigation'
import UserList from '@/components/UserList'
import FollowButton from '@/components/FollowButton'

interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
  followersCount?: number
  followingCount?: number
}

interface Post {
  _id: string
  content: string
  image?: string
  user: User
  comments: any[]
  likes: any[]
  createdAt: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following' | 'about'>('posts')
  const [followStatus, setFollowStatus] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchCurrentUser()
      fetchFollowStatus()
    }
  }, [userId])

  const fetchFollowStatus = async () => {
    try {
      const response = await api.get(`/follow/status/${userId}`)
      if (response.data.success) {
        setFollowStatus(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching follow status:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        setCurrentUser(response.data.data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      // For now, we'll get all posts and filter by user
      // In a real app, you'd have a dedicated user profile API
      const postsResponse = await api.get('/api/v1/posts')
      if (postsResponse.data.success) {
        const userPosts = postsResponse.data.data.posts.filter(
          (post: Post) => post.user._id === userId
        )
        setPosts(userPosts)
        
        // Get user info from the first post if available
        if (userPosts.length > 0) {
          setUser(userPosts[0].user)
        } else {
          // If no posts, create a minimal user object
          setUser({
            _id: userId,
            name: 'User',
            email: 'user@example.com'
          })
        }
      }
    } catch (error: any) {
      setError('Failed to load user profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowChange = (isFollowing: boolean, newFollowersCount: number) => {
    setUser(prev => prev ? {
      ...prev,
      followersCount: newFollowersCount
    } : null)
    fetchFollowStatus() // Refresh follow status
  }

  const goBack = () => {
    router.back()
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-instagram-gray flex items-center justify-center pb-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instagram-blue mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-instagram-gray flex items-center justify-center pb-16">
        <div className="text-center px-4">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={goBack} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-instagram-gray flex items-center justify-center pb-16">
        <div className="text-center px-4">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-600 mb-4">This user doesn't exist or has no posts.</p>
          <button onClick={goBack} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?._id === user._id

  return (
    <div className="min-h-screen bg-instagram-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={goBack} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{user.name || 'User Profile'}</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Profile Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.avatar ? (
                <img 
                  src={getImageUrl(user.avatar)} 
                  alt={user.name || 'User'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name || 'Unknown User'}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around text-center mb-4">
            <div>
              <div className="text-xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-gray-600 text-sm">Posts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{followStatus?.followersCount || 0}</div>
              <div className="text-gray-600 text-sm">Followers</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{followStatus?.followingCount || 0}</div>
              <div className="text-gray-600 text-sm">Following</div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex space-x-2">
              <div className="flex-1">
                <FollowButton 
                  userId={userId}
                  initialIsFollowing={followStatus?.isFollowing}
                  onFollowChange={handleFollowChange}
                  className="w-full"
                />
              </div>
              <button 
                onClick={startChat}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                💬 Message
              </button>
            </div>
          )}

          {isOwnProfile && (
            <div className="flex space-x-2">
              <Link href="/profile/edit" className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 text-center">
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 text-xs font-medium border-b-2 ${
                activeTab === 'posts'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📱 Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`py-3 text-xs font-medium border-b-2 ${
                activeTab === 'followers'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`py-3 text-xs font-medium border-b-2 ${
                activeTab === 'following'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Following
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 text-xs font-medium border-b-2 ${
                activeTab === 'about'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ℹ️ About
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        {activeTab === 'posts' && (
          <div>
            {posts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">
                  {isOwnProfile ? "Share your first post!" : `${user.name || 'This user'} hasn't shared any posts yet.`}
                </p>
                {isOwnProfile && (
                  <Link href="/create" className="btn-primary inline-block mt-4">
                    Create Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-1 px-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post}
                    onPostUpdate={fetchUserProfile}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="px-4">
            <UserList userId={userId} type="followers" />
          </div>
        )}

        {activeTab === 'following' && (
          <div className="px-4">
            <UserList userId={userId} type="following" />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white p-4 mx-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">About {user.name || 'User'}</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Joined:</span>
                <span className="ml-2 text-gray-900">Recently</span>
              </div>
              <div>
                <span className="text-gray-600">Bio:</span>
                <span className="ml-2 text-gray-900">No bio available</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
