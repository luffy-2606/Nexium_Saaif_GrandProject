import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface TranslateRequest {
  recipeId: string
  language: string
}

// Remove LibreTranslate helper function - n8n only

// Function to translate recipe using ONLY your n8n workflow
async function translateRecipeWithAI(recipe: any, targetLanguage: string) {
  // Check if translation webhook is configured
  const translationWebhook = process.env.N8N_TRANSLATION_WEBHOOK || process.env.N8N_WEBHOOK_URL
  
  if (!translationWebhook) {
    throw new Error('Translation service not configured. Please set up N8N_TRANSLATION_WEBHOOK or N8N_WEBHOOK_URL.')
  }

  console.log('🌐 Calling your n8n translation workflow...')
  console.log('Recipe:', recipe.title, 'to', targetLanguage)
  
  try {
    const response = await fetch(translationWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_TOKEN && {
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
        })
      },
      body: JSON.stringify({
        type: 'recipe_translation',
        recipe: {
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions
        },
        targetLanguage: targetLanguage,
        sourceLanguage: 'english'
      }),
    })

    const responseText = await response.text()
    console.log('n8n translation response status:', response.status)
    console.log('n8n translation raw response:', responseText)

    if (!response.ok) {
      throw new Error(`n8n translation workflow failed with status ${response.status}: ${response.statusText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('n8n translation response parse error:', parseError)
      throw new Error('n8n translation workflow returned invalid JSON response')
    }

    console.log('✅ n8n translation workflow response:', result)

    // Handle different response formats from your n8n workflow
    if (result.success && result.translation) {
      return result.translation
    } else if (result.translation) {
      return result.translation
    } else if (result.data && result.data.translation) {
      return result.data.translation
    } else if (result.title && result.ingredients && result.instructions) {
      // Direct translation format
      return result
    } else {
      console.error('n8n translation workflow did not return expected format:', result)
      throw new Error('n8n translation workflow response is missing translation data')
    }
      } catch (error) {
      console.error('❌ n8n translation workflow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Translation failed: ${errorMessage}`)
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