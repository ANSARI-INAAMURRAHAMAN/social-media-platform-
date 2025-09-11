'use client'

import { useState, useRef } from 'react'
import api from '@/lib/api'

interface StoryCreateProps {
  onStoryCreated?: () => void
  onClose?: () => void
}

export default function StoryCreate({ onStoryCreated, onClose }: StoryCreateProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file')
      return
    }

    // Validate file size (50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`)
      return
    }

    setError(null)
    setSelectedFile(file)
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const generateAICaption = async () => {
    if (!mediaType) return
    
    setIsGeneratingCaption(true)
    setError(null)
    
    try {
      const response = await api.post('/ai/story-caption', {
        mediaType: mediaType,
        userInput: text.trim() // Use existing text as context if available
      })
      
      if (response.data.success) {
        setText(response.data.data.caption)
      } else {
        setError('Failed to generate caption')
      }
    } catch (error: any) {
      console.error('AI Caption generation error:', error)
      setError('Failed to generate caption. Please try again.')
    } finally {
      setIsGeneratingCaption(false)
    }
  }

  const handleCreateStory = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('storyMedia', selectedFile)
      formData.append('text', text)

      const response = await api.post('/stories/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        // Clean up
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        setText('')
        setMediaType(null)
        
        // Notify parent component
        onStoryCreated?.()
        
        // Close modal if provided
        onClose?.()
      }
    } catch (error: any) {
      console.error('Story creation error:', error)
      setError(error.response?.data?.message || 'Failed to create story')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setMediaType(null)
    setError(null)
    setText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Create Story</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* File Selection */}
            {!selectedFile ? (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload photo or video</p>
                      <p className="text-xs text-gray-500">PNG, JPG, MP4, MOV up to 50MB</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // File Preview
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <div className="aspect-[9/16] max-h-64">
                    {mediaType === 'image' ? (
                      <img
                        src={previewUrl!}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={previewUrl!}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        autoPlay
                        loop
                      />
                    )}
                  </div>
                  
                  {/* Remove file button */}
                  <button
                    onClick={clearSelection}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Text Input */}
                <div>
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Add a caption..."
                      maxLength={500}
                      rows={3}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {/* AI Generate Button */}
                    <button
                      onClick={generateAICaption}
                      disabled={isGeneratingCaption || !mediaType}
                      className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                      title="Generate AI Caption"
                    >
                      {isGeneratingCaption ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {text.length}/500
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="border-t bg-white p-4 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCreateStory}
              disabled={!selectedFile || isUploading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Share Story'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
