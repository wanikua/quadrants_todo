import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"
import { STRIPE_CONFIG } from "@/lib/stripe-config"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic'

export default async function Welcome50PromoPage() {
    const user = await getCurrentUser()

    // 未登录用户 → 跳转到登录页面，登录后返回此页面
    if (!user) {
        redirect("/sign-in?redirect_url=/promo/welcome50")
    }

    // 已登录用户 → 直接创建 Stripe checkout session 并跳转
    try {
        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        const origin = `${protocol}://${host}`

        const session = await createCheckoutSession({
            priceId: STRIPE_CONFIG.prices.pro_monthly,
            userId: user.id,
            userEmail: user.email,
            successUrl: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/dashboard?canceled=true`,
            promotionCode: 'WELCOME50',
        })

        if (session.url) {
            redirect(session.url)
        }
    } catch (error) {
        console.error('Error creating checkout session for promo:', error)
        // 如果创建失败，回退到 dashboard 并显示 promo code
        redirect("/dashboard?promo=WELCOME50&error=checkout_failed")
    }

    // Fallback - 不应该到达这里
    redirect("/dashboard?promo=WELCOME50")
}
