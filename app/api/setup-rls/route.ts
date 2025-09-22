import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to database
    const sql = neon(process.env.DATABASE_URL!)
    
    // Read and execute RLS setup script
    const scriptPath = path.join(process.cwd(), 'scripts', 'setup-rls.sql')
    const setupScript = await fs.readFile(scriptPath, 'utf-8')
    
    // Split the script into individual statements
    const statements = setupScript
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';')
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('DROP')) {
        try {
          await sql(statement as any)
        } catch (error: any) {
          // Ignore errors for already existing objects
          if (!error.message?.includes('already exists')) {
            console.error('Error executing statement:', error)
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Row Level Security has been configured successfully'
    })
  } catch (error) {
    console.error('RLS setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup Row Level Security' },
      { status: 500 }
    )
  }
}
