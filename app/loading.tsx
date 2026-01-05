import Image from "next/image"

export default function Loading() {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center selection:bg-yellow-200">
            {/* Background Decorations - 与主页面相同 */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-100/40 rounded-full blur-[100px] animate-float opacity-70"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-yellow-100/40 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 opacity-[0.4]" style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px'
                }}></div>
            </div>

            {/* Loading Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 animate-slide-up">
                {/* Logo Card */}
                <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-bold hover-lift-shadow transition-all duration-300">
                    <div className="relative w-24 h-24">
                        <Image
                            src="/logo.png"
                            alt="Quadrants"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain animate-bounce-gentle"
                            priority
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-3">
                        Quadrants
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">Loading your workspace...</p>
                </div>

                {/* Animated Dots */}
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 bg-black rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-3 bg-gray-100 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-progress-bar origin-left"></div>
                </div>
            </div>
        </div>
    )
}
