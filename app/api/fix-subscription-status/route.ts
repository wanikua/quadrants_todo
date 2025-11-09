import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * Fix subscription status for existing users
 * This API:
 * 1. Updates database constraint to allow 'active' status
 * 2. Migrates users with subscription_status='pro' to 'active'
 * 3. Returns fix results
 */
export async function POST() {
  try {
    console.log('🔧 Starting subscription status fix...')

    // Step 1: Drop old constraint and add new one that includes 'active'
    console.log('📋 Updating database constraint...')
    try {
      await sql`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
      `

      await sql`
        ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
        CHECK (subscription_status IN (
          'free',                -- Free tier
          'pro',                 -- Pro tier (legacy)
          'team',                -- Team tier
          'active',              -- Stripe: subscription is active
          'canceled',            -- Stripe: subscription canceled
          'past_due',            -- Stripe: payment past due
          'trialing',            -- Stripe: in trial period
          'incomplete',          -- Stripe: incomplete payment
          'incomplete_expired',  -- Stripe: incomplete expired
          'unpaid'               -- Stripe: unpaid
        ));
      `
      console.log('✅ Database constraint updated')
    } catch (error) {
      console.error('❌ Constraint update failed:', error)
      // Continue anyway - constraint might already exist
    }

    // Step 2: Find users with subscription_status='pro' who should be 'active'
    const usersToFix = await sql`
      SELECT id, email, subscription_status, subscription_plan, stripe_subscription_id
      FROM users
      WHERE subscription_status = 'pro'
        AND subscription_plan = 'pro'
        AND stripe_subscription_id IS NOT NULL
    `

    console.log(`📊 Found ${usersToFix.length} users to fix`)

    if (usersToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need fixing',
        fixed: 0,
        users: []
      })
    }

    // Step 3: Update users to 'active' status
    const result = await sql`
      UPDATE users
      SET subscription_status = 'active',
          updated_at = NOW()
      WHERE subscription_status = 'pro'
        AND subscription_plan = 'pro'
        AND stripe_subscription_id IS NOT NULL
      RETURNING id, email, subscription_status, subscription_plan
    `

    console.log(`✅ Fixed ${result.length} users`)

    // Step 4: Verify the fix
    const verifyResult = await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE subscription_plan = 'pro'
        AND subscription_status = 'active'
        AND stripe_subscription_id IS NOT NULL
    `

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${result.length} user(s)`,
      fixed: result.length,
      users: result.map((u: any) => ({
        id: u.id,
        email: u.email,
        status: u.subscription_status,
        plan: u.subscription_plan
      })),
      verification: {
        activeProUsers: parseInt(verifyResult[0]?.count || '0')
      }
    })

  } catch (error) {
    console.error('💥 Fix failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current status without fixing
export async function GET() {
  try {
    const usersWithPro = await sql`
      SELECT id, email, subscription_status, subscription_plan, stripe_subscription_id, created_at
      FROM users
      WHERE subscription_plan = 'pro'
      ORDER BY created_at DESC
    `

    const breakdown = {
      total: usersWithPro.length,
      active: usersWithPro.filter((u: any) => u.subscription_status === 'active').length,
      pro: usersWithPro.filter((u: any) => u.subscription_status === 'pro').length,
      other: usersWithPro.filter((u: any) => !['active', 'pro'].includes(u.subscription_status)).length
    }

    return NextResponse.json({
      success: true,
      breakdown,
      needsFix: breakdown.pro > 0,
      users: usersWithPro.map((u: any) => ({
        id: u.id,
        email: u.email,
        status: u.subscription_status,
        plan: u.subscription_plan,
        hasStripeSubscription: !!u.stripe_subscription_id
      }))
    })

  } catch (error) {
    console.error('Check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
