'use client'

import { useParams } from 'next/navigation'

export default function DirectChatPage() {
  const params = useParams()
  const chatId = params.chatId as string

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Direct Chat
          </h2>
          <p className="text-gray-600">
            Chat ID: {chatId}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Direct messaging feature coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}