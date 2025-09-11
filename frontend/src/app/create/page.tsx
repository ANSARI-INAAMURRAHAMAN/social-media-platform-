'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import BottomNavigation from '@/components/BottomNavigation'
import { useRouter } from 'next/navigation'

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [showAIHelper, setShowAIHelper] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const router = useRouter()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    // Reset file input
    const fileInput = document.getElementById('image-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const generateAIContent = async () => {
    if (!aiInput.trim()) {
      setError('Please enter some ideas for AI to generate content')
      return
    }

    setIsGeneratingContent(true)
    setError('')

    try {
      const response = await api.post('/ai/post-content', {
        userInput: aiInput.trim(),
        mediaType: selectedImage ? 'image' : 'text'
      })

      if (response.data.success) {
        const { caption, hashtags } = response.data.data
        const fullContent = `${caption}\n\n${hashtags}`
        setContent(fullContent)
        setShowAIHelper(false)
        setAiInput('')
      } else {
        setError('Failed to generate content')
      }
    } catch (error: any) {
      console.error('AI Content generation error:', error)
      setError('Failed to generate content. Please try again.')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const generateHashtags = async () => {
    if (!content.trim()) {
      setError('Please enter some content first')
      return
    }

    setIsGeneratingContent(true)
    try {
      const response = await api.post('/ai/hashtags', {
        content: content.trim(),
        category: 'general'
      })

      if (response.data.success) {
        const hashtags = response.data.data.hashtags
        setContent(prev => prev + '\n\n' + hashtags)
      } else {
        setError('Failed to generate hashtags')
      }
    } catch (error: any) {
      console.error('Hashtag generation error:', error)
      setError('Failed to generate hashtags')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const generateContentSuggestions = async () => {
    if (!aiInput.trim()) {
      setError('Please enter some input for suggestions')
      return
    }

    setIsGeneratingContent(true)
    setError('')

    try {
      const response = await api.post('/ai/suggestions', {
        type: 'suggestions',
        input: aiInput.trim(),
        mediaType: selectedImage ? 'image' : 'text'
      })

      if (response.data.success) {
        const suggestions = response.data.data.suggestions || []
        setAiSuggestions(suggestions)
      } else {
        setError('Failed to generate suggestions')
      }
    } catch (error: any) {
      console.error('Suggestions generation error:', error)
      setError('Failed to generate suggestions. Please try again.')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!content.trim() && !selectedImage) {
      setError('Please write something or add an image for your post')
      setIsLoading(false)
      return
    }

    try {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('content', content.trim())
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await api.post('/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setSuccess('Post created successfully!')
        setContent('')
        removeImage()
        // Redirect to feed after 2 seconds
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
      } else {
        setError(response.data.message || 'Failed to create post')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Please log in to create a post')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(error.response?.data?.message || 'Failed to create post. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-instagram-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-instagram-blue">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">New Post</h1>
          <div className="w-12"></div> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="card p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  What's on your mind?
                </label>
                <button
                  type="button"
                  onClick={() => setShowAIHelper(!showAIHelper)}
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Helper
                </button>
              </div>

              {/* AI Helper Panel */}
              {showAIHelper && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">🤖 AI Content Assistant</h4>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Describe what you want to post about..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={generateAIContent}
                        disabled={isGeneratingContent || !aiInput.trim()}
                        className="bg-purple-500 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isGeneratingContent ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          'Generate Content'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={generateContentSuggestions}
                        disabled={isGeneratingContent || !aiInput.trim()}
                        className="bg-indigo-500 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Get Ideas
                      </button>
                      <button
                        type="button"
                        onClick={generateHashtags}
                        disabled={isGeneratingContent || !content.trim()}
                        className="bg-pink-500 text-white px-3 py-2 rounded-md text-sm hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
                      >
                        Add #Tags
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something amazing..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-instagram-blue focus:border-transparent resize-none"
                  maxLength={2000}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Tip: Use AI Helper to get creative ideas!</span>
                <span>{content.length}/2000</span>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">✨ AI Suggestions</h5>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-white border border-blue-200 rounded-md p-2 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setContent(suggestion)}
                      >
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuggestions([])}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear suggestions
                  </button>
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a photo (optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-instagram-blue transition-colors">
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm text-gray-600 mb-1">Click to add a photo</p>
                    <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (!showAIHelper) {
                    setShowAIHelper(true)
                    setAiInput('Generate creative content for my post')
                  }
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Generate
              </button>
              <button
                type="submit"
                disabled={isLoading || (!content.trim() && !selectedImage)}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Posting...' : 'Share Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Tips for a great post:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share what you're thinking or feeling</li>
            <li>• Ask questions to engage your friends</li>
            <li>• Keep it authentic and genuine</li>
          </ul>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
