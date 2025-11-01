import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email'

/**
 * 测试邮件发送 API
 * GET /api/test-email?to=your-email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" parameter. Usage: /api/test-email?to=your-email@example.com' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`Testing email send to: ${to}`)

    const result = await sendTestEmail(to)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        emailId: result.data?.id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email',
          details: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
