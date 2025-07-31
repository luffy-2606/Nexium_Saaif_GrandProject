import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { testType, testData } = await request.json()

    const results: {
      recipeGeneration: any,
      configuration: {
        recipeWebhook: boolean,
        authToken: boolean
      }
    } = {
      recipeGeneration: null,
      configuration: {
        recipeWebhook: !!process.env.N8N_WEBHOOK_URL,
        authToken: !!process.env.N8N_WEBHOOK_TOKEN
      }
    }

    // Test Recipe Generation Workflow
    if (testType === 'recipe' || !testType) {
      if (!process.env.N8N_WEBHOOK_URL) {
        results.recipeGeneration = {
          success: false,
          error: 'N8N_WEBHOOK_URL not configured',
          message: 'Please add your n8n recipe generation webhook URL to environment variables'
        }
      } else {
        try {
          const recipePayload = {
            type: 'recipe_generation',
            data: testData?.recipe || {
              ingredients: ['chicken breast', 'rice', 'vegetables'],
              dietaryRestrictions: [],
              cuisine: 'Asian',
              servings: 2,
              difficulty: 'easy',
              cookingTime: 30
            },
            prompt: 'Generate a test recipe for n8n integration'
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Testing n8n recipe generation workflow...')
            console.log('Recipe payload:', recipePayload)
          }

          const response = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.N8N_WEBHOOK_TOKEN && {
                'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
              })
            },
            body: JSON.stringify(recipePayload)
          })

          const responseText = await response.text()
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Recipe generation response status:', response.status)
            console.log('Recipe generation response:', responseText)
          }

          if (!response.ok) {
            results.recipeGeneration = {
              success: false,
              error: `n8n recipe workflow responded with ${response.status}`,
              details: responseText,
              webhookUrl: process.env.N8N_WEBHOOK_URL
            }
          } else {
            let responseData
            try {
              responseData = JSON.parse(responseText)
            } catch (parseError) {
              results.recipeGeneration = {
                success: false,
                error: 'n8n recipe response is not valid JSON',
                rawResponse: responseText
              }
            }

            if (responseData) {
              results.recipeGeneration = {
                success: true,
                message: 'n8n recipe generation workflow working correctly!',
                n8nResponse: responseData,
                webhookUrl: process.env.N8N_WEBHOOK_URL
              }
            }
          }
        } catch (error) {
          console.error('Recipe generation test error:', error)
          results.recipeGeneration = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to connect to n8n recipe generation webhook'
          }
        }
      }
    }



    return NextResponse.json({
      success: true,
      message: 'n8n workflow tests completed',
      results,
      instructions: {
        usage: 'POST with testType: "recipe"',
        environment: {
          N8N_WEBHOOK_URL: 'For recipe generation',
          N8N_WEBHOOK_TOKEN: 'For authentication (optional)'
        }
      }
    })

  } catch (error) {
    console.error('n8n test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test n8n workflows'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'n8n Test Endpoint - Your Workflows Status',
    configuration: {
      recipeGeneration: {
        configured: !!process.env.N8N_WEBHOOK_URL,
        url: process.env.N8N_WEBHOOK_URL ? 'Configured' : 'Not configured'
      },
      authentication: {
        configured: !!process.env.N8N_WEBHOOK_TOKEN
      }
    },
    usage: {
      testRecipe: 'POST /api/test-n8n with { "testType": "recipe" }'
    },
    priority: {
      recipeGeneration: [
        '1. Your n8n workflow (N8N_WEBHOOK_URL)',
        '2. OpenAI (OPENAI_API_KEY)',
        '3. Mock recipe fallback'
      ]
    }
  })
} 