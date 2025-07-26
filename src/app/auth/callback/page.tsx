'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error.message)
          router.push('/login?error=auth_failed')
          return
        }

        if (data?.session) {
          // Create or update user profile
          const { user } = data.session
          
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email!,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.error('Profile creation error:', profileError.message)
          }

          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  )
} 