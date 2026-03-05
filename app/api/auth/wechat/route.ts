import { NextRequest, NextResponse } from 'next/server'
import { getWeChatAuthUrl } from '@/lib/wechat-auth'

/**
 * GET /api/auth/wechat
 * Redirect user to WeChat OAuth authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    const redirectUri = `${origin}/api/auth/wechat/callback`
    const state = crypto.randomUUID().slice(0, 8)

    const authUrl = getWeChatAuthUrl(redirectUri, state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('WeChat auth error:', error)
    return NextResponse.redirect(
      new URL('/sign-in?error=wechat_config', request.url)
    )
  }
}
