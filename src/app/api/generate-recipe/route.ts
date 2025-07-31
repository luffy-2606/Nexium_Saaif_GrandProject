import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'

interface RecipeRequest {
  ingredients: string[]
  dietaryRestrictions: string[]
  cuisine?: string
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
}

// Function to generate recipe using ONLY your n8n workflow
async function generateRecipeWithAI(requestData: RecipeRequest) {
  // Check if n8n webhook is configured
  if (!process.env.N8N_WEBHOOK_URL) {
    throw new Error('Recipe generation service not configured. Please set up N8N_WEBHOOK_URL.')
  }

  console.log('🚀 Calling n8n recipe generation workflow...')
  
  try {
    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_TOKEN && {
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
        })
      },
      body: JSON.stringify({
        type: 'recipe_generation',
        data: requestData,
        prompt: `Generate a detailed recipe with ingredients: ${requestData.ingredients.join(', ')}, cuisine: ${requestData.cuisine || 'Any'}, servings: ${requestData.servings}, difficulty: ${requestData.difficulty}`
      }),
    })

    const responseText = await response.text()
    
    console.log('n8n response status:', response.status)

    if (!response.ok) {
      console.error('❌ n8n webhook failed:')
      console.error('Status:', response.status, response.statusText)
      console.error('Response:', responseText)
      throw new Error(`n8n recipe generation workflow failed with status ${response.status}: ${response.statusText}. Response: ${responseText}`)
    }

    if (!responseText || responseText.trim() === '') {
      console.error('❌ n8n webhook returned empty response')
      throw new Error('n8n workflow returned empty response. Please check your n8n workflow configuration - it must return recipe JSON data using a "Respond to Webhook" node.')
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ n8n response parse error:', parseError)
      console.error('Raw response that failed to parse:', responseText)
      throw new Error(`n8n workflow returned invalid JSON response: ${parseError}. Raw response: ${responseText}`)
    }

    console.log('✅ n8n workflow responded successfully')
    console.log('📋 Raw n8n response structure:', JSON.stringify(result, null, 2))

    // Handle array response from n8n (it returns an array)
    let recipeData = result
    if (Array.isArray(result) && result.length > 0) {
      recipeData = result[0] // Get first item from array
      console.log('✅ Extracted recipe from response array')
    }

    console.log('📋 Recipe data to process:', JSON.stringify(recipeData, null, 2))

    // Handle different response formats from your n8n workflow
    if (recipeData.success && recipeData.recipe) {
      console.log('✅ Using success + recipe format')
      return recipeData.recipe
    } else if (recipeData.recipe) {
      console.log('✅ Using recipe format')
      return recipeData.recipe
    } else if (recipeData.data && recipeData.data.recipe) {
      console.log('✅ Using data.recipe format')
      return recipeData.data.recipe
    } else if (recipeData.title && recipeData.ingredients && recipeData.instructions) {
      console.log('✅ Using direct recipe format')
      return recipeData
    } else {
      console.error('❌ n8n workflow did not return expected recipe format:', recipeData)
      console.error('Available keys in response:', Object.keys(recipeData))
      throw new Error(`n8n workflow response is missing recipe data. Got: ${JSON.stringify(recipeData, null, 2)}`)
    }
      } catch (error) {
      console.error('❌ n8n workflow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Recipe generation failed: ${errorMessage}`)
    }
}

// Remove mock recipe generator - n8n only

export async function POST(request: NextRequest) {
  console.log('🚀 API Route: Starting recipe generation request')
  
  try {
    // Check environment variables first
    if (!process.env.N8N_WEBHOOK_URL) {
      console.error('❌ N8N_WEBHOOK_URL environment variable is not set')
      return NextResponse.json({ error: 'Recipe generation service not configured' }, { status: 500 })
    }
    
    console.log('✅ N8N_WEBHOOK_URL is configured')
    
    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    console.log('🔐 Checking authentication...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', user.id)

    const requestData: RecipeRequest = await request.json()

    // Validate request data
    if (!requestData.ingredients || requestData.ingredients.length === 0) {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 })
    }

    console.log('🍳 Generating recipe for user:', user.id)

    // Generate recipe using AI
    const aiRecipe = await generateRecipeWithAI(requestData)
    
    console.log('✅ AI Recipe received successfully')
    console.log('🤖 AI Recipe structure:', JSON.stringify(aiRecipe, null, 2))

    // Create recipe object for database
    const recipe = {
      userId: user.id,
      title: aiRecipe.title || 'Generated Recipe',
      description: aiRecipe.description || `A delicious recipe with ${requestData.ingredients.join(', ')}`,
      ingredients: aiRecipe.ingredients || ['No ingredients specified'],
      instructions: aiRecipe.instructions || ['No instructions provided'],
      dietaryRestrictions: requestData.dietaryRestrictions,
      cuisine: requestData.cuisine || null,
      prepTime: aiRecipe.prepTime || null,
      cookTime: aiRecipe.cookTime || null,
      servings: requestData.servings,
      difficulty: requestData.difficulty,
      aiGenerated: true,
      originalLanguage: 'english',
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false
    }

    let recipeId = 'temp-' + Date.now() // Fallback ID if database save fails

    // Try to save to MongoDB (optional - don't fail if this times out)
    try {
      console.log('💾 Attempting to save recipe to database...')
      const db = await getDatabase()
      const result = await db.collection('recipes').insertOne(recipe)
      recipeId = result.insertedId.toString()
      console.log('✅ Recipe saved to database with ID:', recipeId)

      // Save search history
      try {
        const history = {
          userId: user.id,
          searchQuery: `${requestData.ingredients.join(', ')} - ${requestData.cuisine || 'Any cuisine'}`,
          ingredients: requestData.ingredients,
          dietaryRestrictions: requestData.dietaryRestrictions,
          generatedRecipeId: recipeId,
          timestamp: new Date()
        }
        await db.collection('userHistory').insertOne(history)
        console.log('✅ Search history saved')
      } catch (historyError) {
        console.warn('⚠️ Failed to save search history (non-critical):', historyError)
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to save recipe to database (recipe will still be returned):', dbError)
      console.warn('⚠️ Using temporary ID for recipe display')
    }

    // Return the generated recipe with ID (even if database save failed)
    const finalResponse = {
      id: recipeId,
      ...recipe,
      tips: aiRecipe.tips || []
    }
    
    console.log('🚀 Final response being sent to frontend:', JSON.stringify(finalResponse, null, 2))
    
    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('❌ Recipe generation error:', error)
    console.error('❌ Error stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: `Recipe generation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
} 