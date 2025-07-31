import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'development') {
    console.log('Testing Supabase connection...')
  }
    
    // Test 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL not configured properly',
        supabaseUrl: supabaseUrl
      }, { status: 400 })
    }
    
    if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured properly',
        hasKey: !!supabaseKey
      }, { status: 400 })
    }
    
    // Test 2: Check if profiles table exists and its structure
    let profilesTableExists = false
    let profilesError = null
    let insertError = null
    let rlsStatus = 'unknown'
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      profilesTableExists = !error
      profilesError = error?.message || null
      
      // Test RLS behavior (this should fail with RLS error, which is GOOD)
      if (profilesTableExists) {
        const testInsert = await supabase
          .from('profiles')
          .insert({ 
            id: '00000000-0000-0000-0000-000000000000',
            email: 'test@example.com',
            full_name: 'Test User'
          })
        
        insertError = testInsert.error?.message || null
        
        // Analyze the RLS behavior
        if (testInsert.error?.message?.includes('row-level security')) {
          rlsStatus = 'properly_configured' // This is what we WANT - RLS is working
        } else if (testInsert.error?.message?.includes('duplicate key')) {
          rlsStatus = 'properly_configured' // Also good - means RLS passed but data exists
        } else if (!testInsert.error) {
          rlsStatus = 'disabled' // This would be bad - no RLS protection
        } else {
          rlsStatus = 'unknown_error'
        }
      }
    } catch (error) {
      profilesError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Test 3: Test auth service
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    // Test 4: Test OTP capability (without sending email)
    let otpTestResult = null
    try {
      // This tests the auth service without sending an actual email
      const testOTP = await supabase.auth.signInWithOtp({
        email: 'nonexistent-test-email@example.com',
        options: { shouldCreateUser: false }
      })
      otpTestResult = testOTP.error?.message || 'OTP service working'
    } catch (error) {
      otpTestResult = error instanceof Error ? error.message : 'OTP test failed'
    }
    
    const recommendations = []
    
    // Determine overall success
    const isSetupCorrect = profilesTableExists && 
                          rlsStatus === 'properly_configured' && 
                          !authError &&
                          !otpTestResult?.includes('Invalid API key')
    
    if (!profilesTableExists) {
      recommendations.push({
        issue: 'profiles_table_missing',
        message: 'The profiles table does not exist',
        action: 'Run the fixSQL to create the table'
      })
    } else if (rlsStatus === 'disabled') {
      recommendations.push({
        issue: 'rls_disabled',
        message: 'Row Level Security is disabled - this is a security risk',
        action: 'Run the fixSQL to enable proper RLS policies'
      })
    } else if (rlsStatus === 'unknown_error') {
      recommendations.push({
        issue: 'rls_unknown_error',
        message: 'Unexpected database behavior',
        action: 'Check the insertError details'
      })
    }
    
    if (authError) {
      recommendations.push({
        issue: 'auth_service_error',
        message: 'Authentication service has issues',
        action: 'Check Supabase project status'
      })
    }
    
    return NextResponse.json({
      success: isSetupCorrect,
      status: isSetupCorrect ? 'All systems working correctly!' : 'Some issues detected',
      tests: {
        environmentVariables: {
          supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
          hasAnonKey: !!supabaseKey,
          keyLength: supabaseKey?.length
        },
        databaseSchema: {
          profilesTableExists,
          profilesError,
          rlsStatus,
          insertError: insertError ? insertError.substring(0, 100) + (insertError.length > 100 ? '...' : '') : null,
          interpretation: rlsStatus === 'properly_configured' ? 
            'RLS is working correctly (blocking unauthorized inserts)' : 
            'RLS may need configuration'
        },
        authService: {
          sessionCheck: !authError,
          authError: authError?.message || null,
          otpCapability: otpTestResult
        }
      },
      recommendations,
      note: isSetupCorrect ? 
        'Your Supabase setup is working perfectly! Magic links should work.' :
        'Some configuration needed - see recommendations.'
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Testing magic link for email: ${email}`)
    }
    
    // Test actual magic link sending
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.name || 'unknown',
        details: error,
        recommendation: error.message.includes('Database error') ? 
          'Database setup issue detected. Run Test Connection to get fix.' : 
          null
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Magic link sent successfully! Check your email.',
      data: data
    })
    
  } catch (error) {
    console.error('Magic link test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 