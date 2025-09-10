'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import FollowButton from '@/components/FollowButton'
import BottomNavigation from '@/components/BottomNavigation'

interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
  isFollowing?: boolean
  followersCount?: number
  followingCount?: number
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'search'>('discover')

  useEffect(() => {
    fetchDiscoverData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchUsers()
      }, 500)
      
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchDiscoverData = async () => {
    setIsLoading(true)
    try {
      // Fetch suggested users
      const suggestedResponse = await api.get('/discover/suggested?limit=5')
      if (suggestedResponse.data.success) {
        setSuggestedUsers(suggestedResponse.data.data.users)
      }

      // Fetch all users
      const usersResponse = await api.get('/discover/users?limit=20')
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users)
      }
    } catch (error: any) {
      setError('Failed to load users')
      console.error('Error fetching discover data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) return
    
    setIsSearching(true)
    try {
      const response = await api.get(`/discover/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (response.data.success) {
        setSearchResults(response.data.data.users)
      }
    } catch (error: any) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update user in all lists
    const updateUser = (user: User) => 
      user._id === userId ? { ...user, isFollowing } : user

    setUsers(prev => prev.map(updateUser))
    setSuggestedUsers(prev => prev.map(updateUser))
    setSearchResults(prev => prev.map(updateUser))
  }

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <Link href={`/profile/${user._id}`}>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-105 transition-transform">
              {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
            </div>
          </Link>
          
          {/* User Info */}
          <div>
            <Link href={`/profile/${user._id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-instagram-blue cursor-pointer">
                {user.name || 'Unknown User'}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">{user.username || user.email}</p>
            <p className="text-xs text-gray-500">
              {user.followersCount || 0} followers
            </p>
          </div>
        </div>

        {/* Follow Button */}
        <FollowButton 
          userId={user._id}
          initialIsFollowing={user.isFollowing}
          onFollowChange={(isFollowing) => handleFollowChange(user._id, isFollowing)}
          className="text-sm px-4 py-1.5"
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-instagram-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding people...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-instagram-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/feed" className="text-instagram-blue">
              ← Back
            </Link>
            <h1 className="text-lg font-semibold">Discover People</h1>
            <div className="w-12"></div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setActiveTab('search')
              }}
              placeholder="Search users..."
              className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue focus:border-transparent"
            />
            <div className="absolute right-3 top-2.5">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-instagram-blue"></div>
              ) : (
                <span className="text-gray-400">🔍</span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex mt-3">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
                activeTab === 'discover'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
                activeTab === 'search'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Search Results
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto py-4 px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={fetchDiscoverData}
              className="float-right text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'discover' ? (
          <div>
            {/* Suggested Users */}
            {suggestedUsers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Suggested for you</h2>
                <div className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </div>
              </div>
            )}

            {/* All Users */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">All Users</h2>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Be the first to join this community!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Search Results {searchQuery && `for "${searchQuery}"`}
            </h2>
            
            {searchQuery.trim().length < 2 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">Type at least 2 characters to search for users</p>
              </div>
            ) : searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">😔</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
