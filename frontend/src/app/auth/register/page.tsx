'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.post('/users/create', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password
      })

      if (response.data.success) {
        // Redirect to login page after successful registration
        router.push('/auth/login?message=Account created successfully!')
      } else {
        setError(response.data.message || 'Registration failed')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-instagram-dark mb-4">
            Instagram
          </h1>
          <p className="text-gray-600">
            Sign up to see photos and videos from your friends.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || 'https://instagram-clone-backend-tu60.onrender.com') + '/users/auth/google'}
          className="w-full btn-secondary mb-4"
        >
          Sign up with Google
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Have an account?{' '}
            <Link href="/auth/login" className="text-instagram-blue hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
