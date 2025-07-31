import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing MongoDB connectivity from Vercel...')
  
  try {
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'MONGODB_URI not configured',
        success: false 
      })
    }

    console.log('📍 MongoDB URI prefix:', process.env.MONGODB_URI.substring(0, 20) + '...')
    console.log('📍 Database name:', process.env.MONGODB_DB_NAME || 'recipe_generator')

    const startTime = Date.now()
    
    // Test database connection
    const db = await getDatabase()
    
    const connectionTime = Date.now() - startTime
    console.log(`📡 Connected to MongoDB in ${connectionTime}ms`)

    // Test a simple query
    const queryStartTime = Date.now()
    const collections = await db.listCollections().toArray()
    const queryTime = Date.now() - queryStartTime
    
    console.log(`📊 Listed collections in ${queryTime}ms`)
    console.log('📋 Available collections:', collections.map(c => c.name))

    // Test a simple write/read operation
    const testStartTime = Date.now()
    const testCollection = db.collection('_connectivity_test')
    
    const testDoc = {
      timestamp: new Date(),
      test: 'connectivity_check',
      vercel: true
    }
    
    const insertResult = await testCollection.insertOne(testDoc)
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId })
    await testCollection.deleteOne({ _id: insertResult.insertedId })
    
    const testTime = Date.now() - testStartTime
    console.log(`📝 Write/Read test completed in ${testTime}ms`)

    return NextResponse.json({
      success: true,
      message: 'MongoDB connectivity test successful',
      timings: {
        connection: connectionTime,
        listCollections: queryTime,
        writeReadTest: testTime,
        total: Date.now() - startTime
      },
      collections: collections.map(c => c.name),
      testDocumentId: insertResult.insertedId.toString(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ MongoDB connectivity test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString()
    })
  }
}