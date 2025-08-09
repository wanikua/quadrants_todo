import { NextResponse } from 'next/server'
import { db } from '@/app/db'

export async function GET() {
  if (!db) {
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection not available. Please check your DATABASE_URL environment variable.' 
    }, { status: 500 })
  }

  try {
    // Test database connection
    const result = await db.execute('SELECT NOW() as current_time')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database test successful',
      data: result
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database test failed' 
    }, { status: 500 })
  }
}
