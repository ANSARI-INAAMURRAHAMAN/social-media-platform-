'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        const userData = response.data.data.user
        setUser(userData)
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          username: userData.username || '',
          password: '',
          confirmPassword: ''
        })
      }
    } catch (error: any) {
      setError('Failed to load profile')
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validate form
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      
      // Only include password in the update if it's provided
      const updateData = {
        name: formData.name,
        email: formData.email,
        username: formData.username
      }

      if (formData.password) {
        Object.assign(updateData, { password: formData.password })
      }

      const response = await api.post('/users/update', updateData)
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!')
        // Update local user data
        setUser({
          ...user!,
          name: formData.name,
          email: formData.email,
          username: formData.username
        })
        
        // Reset password fields
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        })
        
        // Redirect back to profile page after a delay
        setTimeout(() => {
          router.push('/profile')
        }, 2000)
      } else {
        setError(response.data.message || 'Failed to update profile')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile')
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/profile" className="text-blue-500">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <div className="w-6"></div> {/* Empty div for flex spacing */}
        </div>
      </header>

      {/* Form */}
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                New Password (leave blank to keep unchanged)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
