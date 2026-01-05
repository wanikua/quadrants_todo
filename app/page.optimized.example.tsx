// app/page.tsx - 优化版本(服务端渲染)
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Footer } from "@/components/footer"
import { auth } from "@clerk/nextjs/server"

// 客户端组件 - 按需导入
import { HeroClient } from "@/components/landing/HeroClient"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { ProductHuntBadge } from "@/components/product-hunt-badge"

export const metadata = {
    title: "Quadrants - AI-powered Task Management",
    description: "Minimal effort, maximum productivity. The simplest todo management, yet the most powerful.",
    openGraph: {
        title: "Quadrants - AI-powered Task Management",
        description: "Minimal effort, maximum productivity",
        images: ['/logo.png'],
    },
}

export default async function HomePage() {
    // 服务端获取认证状态
    const { userId } = await auth()
    const isSignedIn = !!userId

    // 结构化数据
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Quadrants",
        "description": "AI-powered task management. Minimal effort, maximum productivity.",
        "url": "https://quadrants.ch",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* 背景装饰 - 静态CSS */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-100/40 rounded-full blur-[100px] animate-float opacity-70"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-yellow-100/40 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 opacity-[0.4]" style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px'
                }}></div>
            </div>

            {/* Header - 服务端渲染 */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 shadow-sm">
                <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="group relative flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
                            <Image
                                src="/logo.png"
                                alt="Quadrants Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                                priority
                            />
                        </div>
                        <span className="text-2xl font-black text-black tracking-tight">Quadrants</span>
                    </Link>

                    <nav className="flex items-center gap-4">
                        {isSignedIn ? (
                            <Link href="/projects">
                                <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/sign-in">
                                    <Button variant="ghost" className="text-black hover:bg-gray-100 font-bold text-base px-4 h-auto rounded-xl">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/sign-up">
                                    <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section - 客户端组件处理动画 */}
                    <HeroClient />

                    {/* Features - 服务端渲染 */}
                    <FeaturesSection />
                </div>
            </main>

            <ProductHuntBadge />
            <Footer />
        </div>
    )
}
