import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Debug endpoint to check environment variables in production
  return NextResponse.json({
    hasN8nWebhookUrl: !!process.env.N8N_WEBHOOK_URL,
    hasMongoDbUri: !!process.env.MONGODB_URI,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    // Don't expose actual values for security
    n8nUrlPrefix: process.env.N8N_WEBHOOK_URL?.substring(0, 20) + '...',
    mongoDbNameExists: !!process.env.MONGODB_DB_NAME,
  })
}