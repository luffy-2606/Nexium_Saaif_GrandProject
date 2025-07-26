import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface TranslateRequest {
  recipeId: string
  language: string
}

async function translateRecipeWithAI(recipe: any, targetLanguage: string) {
  const prompt = `
Translate the following recipe to ${targetLanguage}. Maintain the original structure and measurements.

Title: ${recipe.title}
Ingredients: ${recipe.ingredients.join('\n')}
Instructions: ${recipe.instructions.join('\n')}

Please provide the translation in JSON format:
{
  "title": "translated title",
  "ingredients": ["translated ingredient 1", "translated ingredient 2", ...],
  "instructions": ["translated instruction 1", "translated instruction 2", ...]
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
              content: `You are a professional translator specializing in culinary translations. Always respond with valid JSON and maintain cooking measurements and techniques accurately.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      })

      const data = await response.json()
      const content = data.choices[0].message.content
      
      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI translation error:', error)
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
          type: 'recipe_translation',
          recipe: recipe,
          targetLanguage: targetLanguage,
          prompt: prompt
        }),
      })

      return await response.json()
    } catch (error) {
      console.error('n8n translation error:', error)
    }
  }

  // Fallback: Mock translation for demo
  return {
    title: `[${targetLanguage.toUpperCase()}] ${recipe.title}`,
    ingredients: recipe.ingredients.map((ing: string) => `[${targetLanguage.toUpperCase()}] ${ing}`),
    instructions: recipe.instructions.map((inst: string) => `[${targetLanguage.toUpperCase()}] ${inst}`)
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

    const { recipeId, language }: TranslateRequest = await request.json()

    if (!recipeId || !language) {
      return NextResponse.json({ error: 'Recipe ID and language are required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get the recipe
    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(recipeId),
      userId: user.id
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Check if translation already exists
    if (recipe.translations && recipe.translations[language]) {
      return NextResponse.json({
        id: recipe._id.toString(),
        ...recipe,
        title: recipe.translations[language].title,
        ingredients: recipe.translations[language].ingredients,
        instructions: recipe.translations[language].instructions,
        currentLanguage: language
      })
    }

    // Generate translation
    const translation = await translateRecipeWithAI(recipe, language)

    // Update recipe with translation
    const updateData = {
      [`translations.${language}`]: translation,
      updatedAt: new Date()
    }

    await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      { $set: updateData }
    )

    // Return translated recipe
    return NextResponse.json({
      id: recipe._id.toString(),
      ...recipe,
      title: translation.title,
      ingredients: translation.ingredients,
      instructions: translation.instructions,
      currentLanguage: language,
      translations: {
        ...recipe.translations,
        [language]: translation
      }
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate recipe' },
      { status: 500 }
    )
  }
} 