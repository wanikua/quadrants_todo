import { Resend } from 'resend'

// 延迟初始化 Resend，确保环境变量已加载
let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

// 发件人邮箱（需要在 Resend 中验证）
function getFromEmail() {
  return process.env.EMAIL_FROM || 'onboarding@resend.dev'
}

/**
 * 发送欢迎邮件给新 Pro 用户
 */
export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string
  userName: string
}) {
  try {
    console.log(`Sending welcome email to ${to}...`)

    const resend = getResend()
    const fromEmail = getFromEmail()

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Welcome to Quadrants Pro',
      html: getWelcomeEmailHTML(userName),
    })

    if (error) {
      console.error('Email send failed:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

/**
 * 生成欢迎邮件 HTML
 */
function getWelcomeEmailHTML(userName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quadrants.ch'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Quadrants Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border: 3px solid #000000; border-radius: 20px;">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center; background-color: #000000; border-radius: 17px 17px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to Quadrants Pro
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 48px;">
              <p style="margin: 0 0 24px; color: #000000; font-size: 18px; line-height: 1.6; font-weight: 600;">
                Hey ${userName || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #000000; font-size: 16px; line-height: 1.6;">
                Thanks for upgrading to Pro. We're excited to have you on board.
              </p>

              <p style="margin: 0 0 20px; color: #000000; font-size: 16px; line-height: 1.6;">
                You now have access to all Pro features, including unlimited projects, advanced task management, and priority support.
              </p>

              <p style="margin: 0 0 32px; color: #000000; font-size: 16px; line-height: 1.6;">
                If you have any questions or need help getting started, just reply to this email.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 15px; background-color: #000000; border: 3px solid #000000;">
                    <a href="${appUrl}/projects"
                       style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features Section -->
          <tr>
            <td style="padding: 0 48px 40px;">
              <table role="presentation" style="width: 100%; border-spacing: 0 12px;">
                <tr>
                  <td style="padding: 24px; background-color: #FEF3C7; border: 2px solid #000000; border-radius: 15px;">
                    <h3 style="margin: 0 0 8px; color: #000000; font-size: 16px; font-weight: 700;">
                      Unlimited Projects
                    </h3>
                    <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.5;">
                      Create as many projects as you need, no limits.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #ffffff; border: 2px solid #000000; border-radius: 15px;">
                    <h3 style="margin: 0 0 8px; color: #000000; font-size: 16px; font-weight: 700;">
                      Advanced Features
                    </h3>
                    <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.5;">
                      AI-powered task organization and smart prioritization.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #ffffff; border: 2px solid #000000; border-radius: 15px;">
                    <h3 style="margin: 0 0 8px; color: #000000; font-size: 16px; font-weight: 700;">
                      Priority Support
                    </h3>
                    <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.5;">
                      Get help whenever you need it with priority support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px; text-align: center; border-top: 3px solid #E5E7EB;">
              <p style="margin: 0 0 8px; color: #000000; font-size: 14px; font-weight: 600;">
                Thanks for your support
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                You can manage your subscription anytime from your dashboard.
              </p>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <table role="presentation" style="width: 600px; max-width: 100%; margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 0 24px;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.5;">
                ${new Date().getFullYear()} Quadrants. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(to: string) {
  return sendWelcomeEmail({
    to,
    userName: 'Test User',
  })
}
