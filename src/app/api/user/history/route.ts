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

    // Default fallback data
    const fallbackData = {
      history: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasMore: false
      }
    }

    try {
      console.log('📜 Loading search history from database...')
      const db = await getDatabase()
      const skip = (page - 1) * limit

      // Get search history with pagination
      const [history, totalCount] = await Promise.all([
        db.collection('userHistory')
          .find({ userId: user.id })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('userHistory').countDocuments({ userId: user.id })
      ])

      // Format history for frontend
      const formattedHistory = history.map(item => ({
        id: item._id.toString(),
        searchQuery: item.searchQuery,
        ingredients: item.ingredients,
        dietaryRestrictions: item.dietaryRestrictions,
        generatedRecipeId: item.generatedRecipeId,
        timestamp: item.timestamp
      }))

      console.log('✅ Search history loaded successfully')
      return NextResponse.json({
        history: formattedHistory,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + history.length < totalCount
        }
      })

    } catch (dbError) {
      console.warn('⚠️ Database timeout - returning fallback history data:', dbError)
      return NextResponse.json(fallbackData)
    }

  } catch (error) {
    console.error('❌ Get history error:', error)
    return NextResponse.json({
      history: [],
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