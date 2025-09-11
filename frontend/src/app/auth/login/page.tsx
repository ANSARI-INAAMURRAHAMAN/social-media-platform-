'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for OAuth errors in URL params
    const oauthError = searchParams.get('error')
    if (oauthError) {
      switch (oauthError) {
        case 'oauth_error':
          setError('Google authentication failed. Please try again.')
          break
        case 'oauth_failed':
          setError('Google login was unsuccessful. Please try again.')
          break
        case 'login_failed':
          setError('Login failed after Google authentication.')
          break
        default:
          setError('Authentication error occurred.')
      }
    }

    // Check if user is already authenticated
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Use the verify endpoint that doesn't require auth but checks token validity
      const response = await api.get('/users/auth/verify')
      if (response.data.authenticated) {
        router.push('/feed')
      }
    } catch (error) {
      // Error checking auth status, user likely not authenticated
      console.log('Error checking auth status:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/users/create-session', {
        email,
        password
      })

      if (response.data.success) {
        // Store auth token (JWT-based authentication)
        if (response.data.data.token) {
          localStorage.setItem('authToken', response.data.data.token)
        }
        
        // Redirect to feed
        router.push('/feed')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth
    window.location.href = 'http://localhost:8000/users/auth/google'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-instagram-dark mb-4">
            Instagram
          </h1>
          <p className="text-gray-600">
            Sign in to see photos and videos from your friends.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full btn-secondary mb-4"
        >
          Continue with Google
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-instagram-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
