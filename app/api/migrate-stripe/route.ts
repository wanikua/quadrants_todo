import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    // Add Stripe subscription fields to users table
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
    `

    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT
    `

    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'
    `

    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'
    `

    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP
    `

    // Create indexes for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)
    `

    // Update existing users to have free plan
    await sql`
      UPDATE users
      SET subscription_plan = 'free', subscription_status = 'free'
      WHERE subscription_plan IS NULL
    `

    return NextResponse.json({
      success: true,
      message: 'Stripe fields migration completed successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 })
  }
}
