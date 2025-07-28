import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { testType, testData } = await request.json()

    const results: {
      recipeGeneration: any,
      translation: any,
      configuration: {
        recipeWebhook: boolean,
        translationWebhook: boolean,
        authToken: boolean
      }
    } = {
      recipeGeneration: null,
      translation: null,
      configuration: {
        recipeWebhook: !!process.env.N8N_WEBHOOK_URL,
        translationWebhook: !!process.env.N8N_TRANSLATION_WEBHOOK,
        authToken: !!process.env.N8N_WEBHOOK_TOKEN
      }
    }

    // Test Recipe Generation Workflow
    if (testType === 'recipe' || testType === 'both' || !testType) {
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

          console.log('🚀 Testing n8n recipe generation workflow...')
          console.log('Recipe payload:', recipePayload)

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
          console.log('Recipe generation response status:', response.status)
          console.log('Recipe generation response:', responseText)

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

    // Test Translation Workflow
    if (testType === 'translation' || testType === 'both' || !testType) {
      const translationWebhook = process.env.N8N_TRANSLATION_WEBHOOK || process.env.N8N_WEBHOOK_URL

      if (!translationWebhook) {
        results.translation = {
          success: false,
          error: 'No translation webhook configured',
          message: 'Please add N8N_TRANSLATION_WEBHOOK or ensure N8N_WEBHOOK_URL supports translation'
        }
      } else {
        try {
          const translationPayload = {
            type: 'recipe_translation',
            recipe: testData?.translation?.recipe || {
              title: 'Test Recipe',
              ingredients: ['2 cups rice', '1 lb chicken', '1 cup vegetables'],
              instructions: ['Cook rice', 'Prepare chicken', 'Add vegetables', 'Serve hot']
            },
            targetLanguage: testData?.translation?.language || 'spanish',
            sourceLanguage: 'english'
          }

          console.log('🌐 Testing n8n translation workflow...')
          console.log('Translation payload:', translationPayload)

          const response = await fetch(translationWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.N8N_WEBHOOK_TOKEN && {
                'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
              })
            },
            body: JSON.stringify(translationPayload)
          })

          const responseText = await response.text()
          console.log('Translation response status:', response.status)
          console.log('Translation response:', responseText)

          if (!response.ok) {
            results.translation = {
              success: false,
              error: `n8n translation workflow responded with ${response.status}`,
              details: responseText,
              webhookUrl: translationWebhook
            }
          } else {
            let responseData
            try {
              responseData = JSON.parse(responseText)
            } catch (parseError) {
              results.translation = {
                success: false,
                error: 'n8n translation response is not valid JSON',
                rawResponse: responseText
              }
            }

            if (responseData) {
              results.translation = {
                success: true,
                message: 'n8n translation workflow working correctly!',
                n8nResponse: responseData,
                webhookUrl: translationWebhook
              }
            }
          }
        } catch (error) {
          console.error('Translation test error:', error)
          results.translation = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to connect to n8n translation webhook'
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'n8n workflow tests completed',
      results,
      instructions: {
        usage: 'POST with testType: "recipe", "translation", or "both"',
        environment: {
          N8N_WEBHOOK_URL: 'For recipe generation',
          N8N_TRANSLATION_WEBHOOK: 'For translation (optional, falls back to main webhook)',
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
      translation: {
        dedicatedWebhook: !!process.env.N8N_TRANSLATION_WEBHOOK,
        fallbackWebhook: !!process.env.N8N_WEBHOOK_URL,
        configured: !!(process.env.N8N_TRANSLATION_WEBHOOK || process.env.N8N_WEBHOOK_URL)
      },
      authentication: {
        configured: !!process.env.N8N_WEBHOOK_TOKEN
      }
    },
    usage: {
      testBoth: 'POST /api/test-n8n with { "testType": "both" }',
      testRecipe: 'POST /api/test-n8n with { "testType": "recipe" }',
      testTranslation: 'POST /api/test-n8n with { "testType": "translation" }'
    },
    priority: {
      recipeGeneration: [
        '1. Your n8n workflow (N8N_WEBHOOK_URL)',
        '2. OpenAI (OPENAI_API_KEY)',
        '3. Mock recipe fallback'
      ],
      translation: [
        '1. Your dedicated n8n translation workflow (N8N_TRANSLATION_WEBHOOK)',
        '2. Your main n8n workflow (N8N_WEBHOOK_URL)',
        '3. OpenAI (OPENAI_API_KEY)',
        '4. LibreTranslate (free service)',
        '5. Fallback message'
      ]
    }
  })
} 