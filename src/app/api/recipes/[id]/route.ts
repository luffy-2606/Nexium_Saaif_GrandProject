import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Find the recipe by ID and ensure it belongs to the user
    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(id),
      userId: user.id
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Format recipe for frontend
    const formattedRecipe = {
      id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      dietaryRestrictions: recipe.dietaryRestrictions,
      isFavorite: recipe.isFavorite,
      aiGenerated: recipe.aiGenerated,
      originalLanguage: recipe.originalLanguage,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt
    }

    return NextResponse.json(formattedRecipe)

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get recipe error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    )
  }
} 