'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import api from '@/lib/api'

interface User {
  _id: string
  name: string
  username: string
  avatar?: string
}

interface Message {
  _id: string
  content: string
  sender: User
  createdAt: string
  messageType: 'text' | 'image'
  readBy: Array<{
    user: string
    readAt: string
  }>
}

interface Chat {
  _id: string
  participants: User[]
  lastMessage?: Message
  lastActivity: string
}

interface ChatableUser {
  user: User
  relationship: 'following' | 'follower' | 'mutual'
}

export default function ChatPage() {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [chatableUsers, setChatableUsers] = useState<ChatableUser[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeChatRef = useRef<Chat | null>(null)

  useEffect(() => {
    initializeChat()
    fetchUserChats()
    fetchChatableUsers()
    fetchCurrentUser()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  // Cleanup temporary messages after a timeout
  useEffect(() => {
    const cleanup = setTimeout(() => {
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')))
    }, 10000) // Remove temp messages after 10 seconds if not replaced

    return () => clearTimeout(cleanup)
  }, [messages])

  const initializeChat = async () => {
    try {
      // Get JWT token from localStorage (using same key as login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found - please login first')
        // Redirect to login page
        router.push('/auth/login')
        return
      }

      const newSocket = io('http://localhost:5001', {
        auth: { token }
      })
      
      newSocket.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to chat server')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from chat server')
      })

      newSocket.on('receive_message', (data: { message: Message, chatId: string }) => {
        console.log('Received message:', data)
        // Check if the message is for the currently active chat
        if (activeChatRef.current && data.chatId === activeChatRef.current._id) {
          setMessages(prev => {
            // Remove any temporary messages with similar content
            const filteredMessages = prev.filter(msg => 
              !msg._id.startsWith('temp-') || msg.content !== data.message.content
            )
            // Add the real message
            return [...filteredMessages, data.message]
          })
        }
        // Update chat list with new message
        fetchUserChats()
      })

      newSocket.on('user_typing', (data: { userId: string, userName: string }) => {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userName])
      })

      newSocket.on('user_stop_typing', (data: { userId: string, userName: string }) => {
        setTypingUsers(prev => prev.filter(name => name !== data.userName))
      })

      newSocket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error.message)
        alert(error.message)
      })

      setSocket(newSocket)
    } catch (error) {
      console.error('Error initializing chat:', error)
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

  const fetchUserChats = async () => {
    try {
      const response = await api.get('/chat/')
      if (response.data.success) {
        setChats(response.data.data.chats)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChatableUsers = async () => {
    try {
      const response = await api.get('/chat/chatable-users')
      if (response.data.success) {
        setChatableUsers(response.data.data.users)
      }
    } catch (error) {
      console.error('Error fetching chatable users:', error)
    }
  }

  const openChat = async (chat: Chat) => {
    try {
      // Leave previous chat room
      if (activeChat && socket) {
        socket.emit('leave_chat', { chatId: activeChat._id })
      }

      setActiveChat(chat)
      activeChatRef.current = chat // Update ref for socket handlers
      setMessages([])

      // Fetch messages for this chat
      const response = await api.get(`/chat/${chat._id}/messages`)
      if (response.data.success) {
        setMessages(response.data.data.messages)
      }

      // Join new chat room
      if (socket) {
        socket.emit('join_chat', { chatId: chat._id })
        socket.emit('mark_messages_read', { chatId: chat._id })
      }
    } catch (error) {
      console.error('Error opening chat:', error)
    }
  }

  const createNewChat = async (userId: string) => {
    try {
      const response = await api.post(`/chat/create/${userId}`)
      if (response.data.success) {
        const newChat = response.data.data.chat
        await fetchUserChats() // Refresh chat list
        await openChat(newChat)
        setShowUserList(false)
      }
    } catch (error: any) {
      console.error('Error creating chat:', error)
      alert(error.response?.data?.message || 'Failed to create chat')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat || !socket) return

    const messageContent = inputMessage.trim()
    
    try {
      // Create temporary message for immediate display
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        sender: currentUser!,
        createdAt: new Date().toISOString(),
        messageType: 'text',
        readBy: []
      }

      // Immediately add to UI for instant feedback
      setMessages(prev => [...prev, tempMessage])
      setInputMessage('')

      // Send via socket for real-time delivery
      socket.emit('send_message', {
        chatId: activeChat._id,
        content: messageContent,
        messageType: 'text'
      })
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      socket.emit('typing_stop', { chatId: activeChat._id })

    } catch (error) {
      console.error('Error sending message:', error)
      // Revert the UI change on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')))
      setInputMessage(messageContent) // Restore the message
    }
  }

  const handleTyping = () => {
    if (!activeChat || !socket) return

    socket.emit('typing_start', { chatId: activeChat._id })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatId: activeChat._id })
    }, 2000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p._id !== currentUser?._id)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg">Loading chats...</div>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">Please log in to access chat</div>
          <Link 
            href="/auth/login"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Messages</h1>
          <button
            onClick={() => setShowUserList(true)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
            title="New Chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Connection Status */}
        <div className={`px-4 py-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              No chats yet. Start a conversation with someone you follow!
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat)
              return (
                <div
                  key={chat._id}
                  onClick={() => openChat(chat)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    activeChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {otherUser?.avatar ? (
                        <img 
                          src={`http://localhost:8000${otherUser.avatar}`} 
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-gray-600">
                          {otherUser?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {otherUser?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{otherUser?.username || 'unknown'}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-400 truncate mt-1">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {getOtherParticipant(activeChat)?.avatar ? (
                  <img 
                    src={`http://localhost:8000${getOtherParticipant(activeChat)?.avatar}`} 
                    alt={getOtherParticipant(activeChat)?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {getOtherParticipant(activeChat)?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {getOtherParticipant(activeChat)?.name || 'Unknown User'}
                </h2>
                <p className="text-sm text-gray-500">
                  @{getOtherParticipant(activeChat)?.username || 'unknown'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender._id === currentUser?._id
                const isTempMessage = message._id.startsWith('temp-')
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? `bg-blue-500 text-white ${isTempMessage ? 'opacity-60' : ''}`
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                        {isTempMessage && isOwn && (
                          <span className="text-xs text-blue-200 ml-2">⏳</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Select a chat to start messaging
              </h2>
              <p className="text-gray-500">
                Choose from existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Start New Chat</h3>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {chatableUsers.length === 0 ? (
              <p className="text-gray-500 text-center">
                No users available to chat with. Follow some users first!
              </p>
            ) : (
              <div className="space-y-2">
                {chatableUsers.map(({ user, relationship }) => (
                  <div
                    key={user._id}
                    onClick={() => createNewChat(user._id)}
                    className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={`http://localhost:8000${user.avatar}`} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      relationship === 'mutual' 
                        ? 'bg-green-100 text-green-800' 
                        : relationship === 'following'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {relationship}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
