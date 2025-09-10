'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/feed', icon: '🏠', label: 'Home' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/create', icon: '➕', label: 'Create' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-instagram-blue bg-blue-50'
                  : 'text-gray-600 hover:text-instagram-blue hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
