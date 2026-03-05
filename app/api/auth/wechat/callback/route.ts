import { NextRequest, NextResponse } from 'next/server'
import { getWeChatAccessToken, getWeChatUserInfo } from '@/lib/wechat-auth'
import { createToken, setAuthCookie } from '@/lib/auth'
import { sql } from '@/lib/database'

/**
 * GET /api/auth/wechat/callback
 * Handle WeChat OAuth callback - exchange code for user info, create/login user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(
      new URL('/sign-in?error=wechat_no_code', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenData = await getWeChatAccessToken(code)
    const { access_token, openid, unionid } = tokenData

    // Get user info from WeChat
    const userInfo = await getWeChatUserInfo(access_token, openid)

    if (!sql) {
      throw new Error('Database not configured')
    }

    // Use unionid if available (cross-app identifier), otherwise openid
    const wechatId = unionid || openid
    const wechatIdField = unionid ? 'wechat_unionid' : 'wechat_openid'

    // Check if user already exists with this WeChat ID
    let user = await sql`
      SELECT id, email, name FROM users
      WHERE wechat_openid = ${openid}
      ${unionid ? sql`OR wechat_unionid = ${unionid}` : sql``}
      LIMIT 1
    `

    let userId: string

    if (user.length > 0) {
      // Existing user - update info
      userId = user[0].id
      await sql`
        UPDATE users SET
          name = COALESCE(NULLIF(${userInfo.nickname}, ''), name),
          wechat_openid = ${openid},
          ${unionid ? sql`wechat_unionid = ${unionid},` : sql``}
          updated_at = NOW()
        WHERE id = ${userId}
      `
    } else {
      // New user - create account
      userId = `wechat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const email = `${openid}@wechat.user` // Placeholder email for WeChat users

      await sql`
        INSERT INTO users (id, email, password_hash, name, wechat_openid, ${unionid ? sql`wechat_unionid,` : sql``} created_at)
        VALUES (
          ${userId},
          ${email},
          '__wechat_user__',
          ${userInfo.nickname || 'WeChat User'},
          ${openid},
          ${unionid ? sql`${unionid},` : sql``}
          NOW()
        )
      `

      // Create example project for new user
      try {
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

        await sql`
          INSERT INTO projects (id, name, description, type, owner_id, invite_code, created_at)
          VALUES (
            ${projectId},
            '欢迎使用 Quadrants! 👋',
            '这是你的示例项目，可以自由探索和修改任务！',
            'personal',
            ${userId},
            ${inviteCode},
            NOW()
          )
        `

        await sql`
          INSERT INTO project_members (id, project_id, user_id, role, joined_at)
          VALUES (
            ${'member_' + Date.now()},
            ${projectId},
            ${userId},
            'owner',
            NOW()
          )
        `
      } catch (projectError) {
        console.error('Failed to create example project for WeChat user:', projectError)
      }
    }

    // Create JWT token and set auth cookie
    const token = await createToken(userId)
    await setAuthCookie(token)

    // Redirect to projects page
    return NextResponse.redirect(new URL('/projects', request.url))

  } catch (error) {
    console.error('WeChat callback error:', error)
    return NextResponse.redirect(
      new URL('/sign-in?error=wechat_failed', request.url)
    )
  }
}
