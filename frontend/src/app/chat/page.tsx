'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  text: string
  user: string
  timestamp: Date
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('User')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize socket connection to your Express.js chat server
    const newSocket = io('http://localhost:5000')
    
    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to chat server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from chat server')
    })

    // Listen for incoming messages
    newSocket.on('receive_message', (data: any) => {
      const message: Message = {
        id: Date.now().toString(),
        text: data.message,
        user: data.user_name || 'Anonymous',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, message])
    })

    setSocket(newSocket)

    // Cleanup on component unmount
    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !socket || !isConnected) return

    // Send message to server
    socket.emit('send_message', {
      message: inputMessage,
      user_name: username
    })

    // Add message to local state
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      user: username,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-instagram-gray flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-instagram-blue">
            ← Back
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Chat</h1>
            <p className="text-xs text-gray-500">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Username Input */}
      {username === 'User' && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-md mx-auto">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter your name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value.trim()
                    if (name) setUsername(name)
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter your name..."]') as HTMLInputElement
                  const name = input?.value.trim()
                  if (name) setUsername(name)
                }}
                className="px-4 py-2 bg-instagram-blue text-white rounded-md text-sm"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user === username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.user === username
                      ? 'bg-instagram-blue text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.user !== username && (
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {message.user}
                    </p>
                  )}
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.user === username ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="px-6 py-2 bg-instagram-blue text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
