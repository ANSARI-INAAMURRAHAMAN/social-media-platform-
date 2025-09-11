'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/feed', icon: '🏠', label: 'Home' },
    { href: '/discover', icon: '🔍', label: 'Discover' },
    { href: '/create', icon: '➕', label: 'Create' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/activity', icon: '❤️', label: 'Activity' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-1 py-1 text-xs ${
                pathname === item.href
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
