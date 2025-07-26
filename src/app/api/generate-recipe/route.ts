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

// Function to call AI service (OpenAI/HuggingFace alternative to n8n)
async function generateRecipeWithAI(requestData: RecipeRequest) {
  const prompt = `
Create a detailed recipe with the following requirements:
- Ingredients available: ${requestData.ingredients.join(', ')}
- Dietary restrictions: ${requestData.dietaryRestrictions.join(', ') || 'None'}
- Cuisine style: ${requestData.cuisine || 'Any'}
- Servings: ${requestData.servings}
- Difficulty: ${requestData.difficulty}
- Maximum cooking time: ${requestData.cookingTime} minutes

Please provide:
1. Recipe title
2. Brief description
3. Complete ingredients list with measurements
4. Step-by-step instructions
5. Estimated prep time and cook time

Format the response as JSON with the following structure:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "ingredients": ["ingredient with measurement", ...],
  "instructions": ["step 1", "step 2", ...],
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "tips": "optional cooking tips"
}
`

  // Option 1: Using OpenAI (if API key is provided)
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional chef who creates detailed, practical recipes. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      const content = data.choices[0].message.content
      
      // Parse the JSON response
      const recipeData = JSON.parse(content)
      return recipeData
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  // Option 2: Using n8n webhook (if URL is provided)
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recipe_generation',
          data: requestData,
          prompt: prompt
        }),
      })

      const recipeData = await response.json()
      return recipeData
    } catch (error) {
      console.error('n8n webhook error:', error)
    }
  }

  // Fallback: Generate a mock recipe for demo purposes
  return generateMockRecipe(requestData)
}

function generateMockRecipe(requestData: RecipeRequest): any {
  const mainIngredient = requestData.ingredients[0] || 'Mixed vegetables'
  const cuisineStyle = requestData.cuisine || 'International'
  
  return {
    title: `${cuisineStyle} ${mainIngredient} Delight`,
    description: `A delicious ${requestData.difficulty} ${cuisineStyle.toLowerCase()} dish featuring ${mainIngredient.toLowerCase()} and other fresh ingredients.`,
    ingredients: [
      `2 cups ${mainIngredient}`,
      ...requestData.ingredients.slice(1).map(ing => `1 cup ${ing}`),
      '2 cloves garlic, minced',
      '1 tbsp olive oil',
      'Salt and pepper to taste',
      '1 tsp herbs (oregano, thyme, or basil)'
    ],
    instructions: [
      'Prep all ingredients by washing, chopping, and measuring.',
      'Heat olive oil in a large pan over medium heat.',
      'Add garlic and sauté for 1-2 minutes until fragrant.',
      `Add ${mainIngredient} and cook for 5-7 minutes.`,
      'Add remaining ingredients and cook until tender.',
      'Season with salt, pepper, and herbs to taste.',
      'Serve hot and enjoy!'
    ],
    prepTime: Math.max(10, Math.floor(requestData.cookingTime * 0.3)),
    cookTime: Math.max(15, Math.floor(requestData.cookingTime * 0.7)),
    tips: `For best results, ensure all ingredients are fresh. This recipe works well with ${requestData.dietaryRestrictions.length > 0 ? requestData.dietaryRestrictions.join(' and ') + ' dietary requirements' : 'any dietary preferences'}.`
  }
}

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