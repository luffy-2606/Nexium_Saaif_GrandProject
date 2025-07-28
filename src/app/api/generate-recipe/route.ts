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

  console.log('🚀 Calling your n8n recipe generation workflow...')
  console.log('Payload:', requestData)
  
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
    console.log('n8n raw response:', responseText)

    if (!response.ok) {
      throw new Error(`n8n recipe generation workflow failed with status ${response.status}: ${response.statusText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('n8n response parse error:', parseError)
      throw new Error('n8n workflow returned invalid JSON response')
    }

    console.log('✅ n8n workflow response:', result)

    // Handle different response formats from your n8n workflow
    if (result.success && result.recipe) {
      return result.recipe
    } else if (result.recipe) {
      return result.recipe
    } else if (result.data && result.data.recipe) {
      return result.data.recipe
    } else if (result.title && result.ingredients && result.instructions) {
      // Direct recipe format
      return result
    } else {
      console.error('n8n workflow did not return expected recipe format:', result)
      throw new Error('n8n workflow response is missing recipe data')
    }
      } catch (error) {
      console.error('❌ n8n workflow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Recipe generation failed: ${errorMessage}`)
    }
}

// Remove mock recipe generator - n8n only

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData: RecipeRequest = await request.json()

    // Validate request data
    if (!requestData.ingredients || requestData.ingredients.length === 0) {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 })
    }

    console.log('Generating recipe for user:', user.id)
    console.log('Request data:', requestData)

    // Generate recipe using AI
    const aiRecipe = await generateRecipeWithAI(requestData)

    // Create recipe object for database
    const recipe = {
      userId: user.id,
      title: aiRecipe.title,
      description: aiRecipe.description,
      ingredients: aiRecipe.ingredients,
      instructions: aiRecipe.instructions,
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

    // Save to MongoDB
    const db = await getDatabase()
    const result = await db.collection('recipes').insertOne(recipe)

    // Save search history
    const history = {
      userId: user.id,
      searchQuery: `${requestData.ingredients.join(', ')} - ${requestData.cuisine || 'Any cuisine'}`,
      ingredients: requestData.ingredients,
      dietaryRestrictions: requestData.dietaryRestrictions,
      generatedRecipeId: result.insertedId.toString(),
      timestamp: new Date()
    }

    await db.collection('userHistory').insertOne(history)

    // Return the generated recipe with ID
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...recipe,
      tips: aiRecipe.tips
    })

  } catch (error) {
    console.error('Recipe generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    )
  }
} 