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
    await db.execute('SELECT 1')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful' 
    })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to database' 
    }, { status: 500 })
  }
}
