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

    const db = await getDatabase()

    // Get user's recipes and stats
    const [recipes, history] = await Promise.all([
      db.collection('recipes').find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      db.collection('userHistory').find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray()
    ])

    // Calculate stats
    const totalRecipes = await db.collection('recipes').countDocuments({ userId: user.id })
    const favoriteRecipes = await db.collection('recipes').countDocuments({ 
      userId: user.id, 
      isFavorite: true 
    })
    const recentSearches = history.length

    // Format recent recipes
    const recentRecipes = recipes.map(recipe => ({
      id: recipe._id.toString(),
      title: recipe.title,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      isFavorite: recipe.isFavorite,
      createdAt: recipe.createdAt
    }))

    return NextResponse.json({
      recentRecipes,
      stats: {
        totalRecipes,
        favoriteRecipes,
        recentSearches
      }
    })

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard data error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
} 