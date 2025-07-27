import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

    const { recipeId } = await request.json()

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get current recipe to toggle favorite status
    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(recipeId),
      userId: user.id
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Toggle favorite status
    const newFavoriteStatus = !recipe.isFavorite

    await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      { 
        $set: { 
          isFavorite: newFavoriteStatus,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      success: true, 
      isFavorite: newFavoriteStatus,
      message: newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites'
    })

  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
} 