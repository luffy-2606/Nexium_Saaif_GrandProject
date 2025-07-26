'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User, LogOut, ChefHat, History, Settings } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user as User || null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user as User || null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">Recipe Generator</span>
            </Link>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/recipes"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Recipes
                </Link>
                <Link
                  href="/history"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  History
                </Link>
              </nav>

              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{user.email}</span>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 