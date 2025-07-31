import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') // 'all', 'favorites', 'recent'

    // Default fallback data
    const fallbackData = {
      recipes: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasMore: false
      }
    }

    try {
      const db = await getDatabase()
      
      // Build query based on filter
      let query: any = { userId: user.id }
      
      if (filter === 'favorites') {
        query.isFavorite = true
      }

      const skip = (page - 1) * limit

      // Get recipes with pagination
      const [recipes, totalCount] = await Promise.all([
        db.collection('recipes')
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('recipes').countDocuments(query)
      ])

      // Format recipes for frontend
      const formattedRecipes = recipes.map(recipe => ({
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
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
      }))

      return NextResponse.json({
        recipes: formattedRecipes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + recipes.length < totalCount
        }
      })

    } catch (dbError) {
      console.warn('⚠️ Database timeout - returning fallback recipes data:', dbError)
      return NextResponse.json(fallbackData)
    }

  } catch (error) {
    console.error('❌ Get recipes error:', error)
    return NextResponse.json({
      recipes: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasMore: false
      }
    })
  }
} 