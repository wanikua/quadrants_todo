/**
 * WeChat OAuth 2.0 Integration
 *
 * Flow:
 * 1. User clicks "Sign in with WeChat"
 * 2. Redirect to WeChat authorize URL
 * 3. WeChat redirects back with code
 * 4. Server exchanges code for access_token + openid
 * 5. Server gets user info with access_token
 * 6. Create/login user in our database
 *
 * Environment variables needed:
 * - WECHAT_APP_ID: WeChat Open Platform App ID
 * - WECHAT_APP_SECRET: WeChat Open Platform App Secret
 * - NEXT_PUBLIC_WECHAT_APP_ID: Same App ID (client-side)
 *
 * WeChat Open Platform: https://open.weixin.qq.com
 * Docs: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */

export interface WeChatUserInfo {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
}

export interface WeChatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * Generate WeChat OAuth authorization URL
 */
export function getWeChatAuthUrl(redirectUri: string, state?: string): string {
  const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID || process.env.WECHAT_APP_ID
  if (!appId) throw new Error('WECHAT_APP_ID not configured')

  const params = new URLSearchParams({
    appid: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state: state || 'quadrants',
  })

  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

/**
 * Exchange authorization code for access token (server-side only)
 */
export async function getWeChatAccessToken(code: string): Promise<WeChatTokenResponse> {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('WeChat credentials not configured')
  }

  const params = new URLSearchParams({
    appid: appId,
    secret: appSecret,
    code,
    grant_type: 'authorization_code',
  })

  const response = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`
  )
  const data: WeChatTokenResponse = await response.json()

  if (data.errcode) {
    throw new Error(`WeChat OAuth error: ${data.errmsg} (${data.errcode})`)
  }

  return data
}

/**
 * Get WeChat user info with access token (server-side only)
 */
export async function getWeChatUserInfo(
  accessToken: string,
  openid: string
): Promise<WeChatUserInfo> {
  const params = new URLSearchParams({
    access_token: accessToken,
    openid,
    lang: 'zh_CN',
  })

  const response = await fetch(
    `https://api.weixin.qq.com/sns/userinfo?${params.toString()}`
  )
  const data = await response.json()

  if (data.errcode) {
    throw new Error(`WeChat user info error: ${data.errmsg} (${data.errcode})`)
  }

  return data as WeChatUserInfo
}
