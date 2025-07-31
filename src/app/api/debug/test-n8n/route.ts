import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Testing n8n connectivity from Vercel...')
  
  try {
    // Check if N8N_WEBHOOK_URL exists
    if (!process.env.N8N_WEBHOOK_URL) {
      return NextResponse.json({ 
        error: 'N8N_WEBHOOK_URL not configured',
        success: false 
      })
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL
    console.log('📍 n8n URL (first 50 chars):', n8nUrl.substring(0, 50) + '...')

    // Test payload similar to real recipe generation
    const testPayload = {
      type: 'recipe_generation',
      data: {
        ingredients: ['test ingredient'],
        cuisine: 'Test',
        servings: 2,
        difficulty: 'easy'
      },
      prompt: 'Generate a test recipe'
    }

    console.log('📤 Sending test request to n8n...')
    
    const startTime = Date.now()
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_TOKEN && {
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
        })
      },
      body: JSON.stringify(testPayload),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`📡 Response received in ${duration}ms`)
    console.log('📊 Status:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Response body (first 500 chars):', responseText.substring(0, 500))

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `n8n returned ${response.status}: ${response.statusText}`,
        responseBody: responseText,
        duration,
        timestamp: new Date().toISOString()
      })
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'n8n returned invalid JSON',
        responseBody: responseText,
        duration,
        parseError: parseError.message,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'n8n connectivity test successful',
      duration,
      responseStatus: response.status,
      responseData: parsedResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ n8n connectivity test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString()
    })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to test n8n connectivity',
    endpoint: '/api/debug/test-n8n',
    method: 'POST'
  })
}