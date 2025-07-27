import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { testData } = await request.json()

    // Test n8n webhook connection
    if (!process.env.N8N_WEBHOOK_URL) {
      return NextResponse.json({
        success: false,
        error: 'N8N_WEBHOOK_URL not configured',
        message: 'Please add your n8n webhook URL to environment variables'
      })
    }

    // Test call to n8n
    const testPayload = {
      type: 'recipe_generation',
      data: testData || {
        ingredients: ['chicken', 'rice'],
        dietaryRestrictions: [],
        cuisine: 'Asian',
        servings: 2,
        difficulty: 'easy',
        cookingTime: 30
      }
    }

    console.log('Testing n8n webhook:', process.env.N8N_WEBHOOK_URL)
    console.log('Test payload:', testPayload)

    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_TOKEN && {
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
        })
      },
      body: JSON.stringify(testPayload)
    })

    const responseText = await response.text()
    console.log('n8n response status:', response.status)
    console.log('n8n response:', responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `n8n webhook responded with ${response.status}`,
        details: responseText,
        webhookUrl: process.env.N8N_WEBHOOK_URL
      })
    }

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'n8n response is not valid JSON',
        rawResponse: responseText
      })
    }

    return NextResponse.json({
      success: true,
      message: 'n8n integration working correctly!',
      n8nResponse: responseData,
      webhookUrl: process.env.N8N_WEBHOOK_URL
    })

  } catch (error) {
    console.error('n8n test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to n8n webhook'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'n8n Test Endpoint',
    configured: !!process.env.N8N_WEBHOOK_URL,
    webhookUrl: process.env.N8N_WEBHOOK_URL ? 'Configured' : 'Not configured',
    translationWebhook: process.env.N8N_TRANSLATION_WEBHOOK ? 'Configured' : 'Not configured'
  })
} 