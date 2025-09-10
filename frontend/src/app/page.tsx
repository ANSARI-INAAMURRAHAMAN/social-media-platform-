import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">📸</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Instagram
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with friends and share your moments
            </p>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/auth/login"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold text-center block hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Sign In
            </Link>
            
            <Link 
              href="/auth/register"
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold text-center block hover:border-purple-500 hover:text-purple-600 transition-all duration-200"
            >
              Create Account
            </Link>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <Link 
              href="/feed"
              className="w-full text-purple-600 py-3 px-6 rounded-xl font-semibold text-center block hover:bg-purple-50 transition-all duration-200"
            >
              View Demo Feed
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">✨ Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Share posts and photos</li>
              <li>• Like and comment on posts</li>
              <li>• Real-time chat with friends</li>
              <li>• Beautiful, responsive design</li>
            </ul>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-6 space-y-1">
            <p className="flex items-center justify-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Backend API: localhost:8000
            </p>
            <p className="flex items-center justify-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Frontend: localhost:3000
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
