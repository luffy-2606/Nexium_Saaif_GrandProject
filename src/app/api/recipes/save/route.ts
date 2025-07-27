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
    
    // Update recipe to mark as saved/favorite
    const result = await db.collection('recipes').updateOne(
      { 
        _id: new ObjectId(recipeId),
        userId: user.id 
      },
      { 
        $set: { 
          isSaved: true,
          savedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Recipe not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Recipe saved successfully' 
    })

  } catch (error) {
    console.error('Save recipe error:', error)
    return NextResponse.json(
      { error: 'Failed to save recipe' },
      { status: 500 }
    )
  }
} 