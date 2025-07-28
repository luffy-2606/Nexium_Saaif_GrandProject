'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Mail, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting to send magic link to:', email)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase auth error:', error)
        toast.error(`Auth Error: ${error.message}`)
        setDebugInfo({
          error: error.message,
          code: error.name || 'unknown',
          details: error
        })
      } else {
        setEmailSent(true)
        toast.success('Check your email for the magic link!')
        console.log('Magic link sent successfully:', data)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'unexpected'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-supabase')
      const result = await response.json()
      console.log('Connection test result:', result)
      setDebugInfo(result)
      
      if (result.success) {
        toast.success('Supabase connection is working!')
      } else {
        toast.error(`Connection issue: ${result.error}`)
      }
    } catch (error) {
      console.error('Test connection error:', error)
      toast.error('Failed to test connection')
    }
  }

  const testEmailSending = async () => {
    if (!email) {
      toast.error('Please enter an email first')
      return
    }

    try {
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const result = await response.json()
      console.log('Email test result:', result)
      setDebugInfo(result)
      
      if (result.success) {
        toast.success('Test email sent successfully!')
      } else {
        toast.error(`Email test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Test email error:', error)
      toast.error('Failed to test email sending')
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 text-center space-y-2">
            <p>Click the link in the email to sign in to your account.</p>
            <p>If you don't see the email, check your spam folder.</p>
            <Button 
              variant="ghost" 
              onClick={() => setEmailSent(false)}
              className="text-orange-500 hover:text-orange-600"
            >
              Try a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your email to receive a magic link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending magic link...
              </>
            ) : (
              'Send magic link'
            )}
          </Button>
        </form>

        {/* Debug Section */}
        <div className="mt-6 space-y-2">
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={testConnection}
              className="flex-1"
            >
              Test Connection
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={testEmailSending}
              className="flex-1"
              disabled={!email}
            >
              Test Email
            </Button>
          </div>
          
          {debugInfo && (
            <Card className="mt-4 p-3 bg-gray-50">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium">Debug Info:</p>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 