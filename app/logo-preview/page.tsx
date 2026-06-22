"use client"

import { QuadrantsLogo } from "@/components/logos/quadrants-logo"

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-white p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-black mb-4">Quadrants Logo 设计</h1>
        <p className="text-xl text-gray-600 mb-12">选择你喜欢的logo设计 - 使用品牌色 #FFD233 (黄) + #000000 (黑)</p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Variant 1 */}
          <div className="border-3 border-black rounded-2xl p-8 shadow-bold bg-white">
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl">
              <QuadrantsLogo variant="v1" size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">V1: 四象限方块</h3>
            <p className="text-gray-600 mb-4">4个方块形成Q的形状，右下角旋转作为Q的尾巴。直观展示"四象限"概念。</p>
            <div className="flex gap-4 items-center">
              <QuadrantsLogo variant="v1" size={60} />
              <QuadrantsLogo variant="v1" size={40} />
              <QuadrantsLogo variant="v1" size={24} />
            </div>
          </div>

          {/* Variant 2 */}
          <div className="border-3 border-black rounded-2xl p-8 shadow-bold bg-white">
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl">
              <QuadrantsLogo variant="v2" size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">V2: 粗体Q字母</h3>
            <p className="text-gray-600 mb-4">黄色背景+黑色边框，中间是粗体Q字母。简洁现代，识别度高。</p>
            <div className="flex gap-4 items-center">
              <QuadrantsLogo variant="v2" size={60} />
              <QuadrantsLogo variant="v2" size={40} />
              <QuadrantsLogo variant="v2" size={24} />
            </div>
          </div>

          {/* Variant 3 */}
          <div className="border-3 border-black rounded-2xl p-8 shadow-bold bg-white">
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl">
              <QuadrantsLogo variant="v3" size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">V3: 2x2网格</h3>
            <p className="text-gray-600 mb-4">抽象的2x2网格，对角黄色方块。极简几何风格，符合"矩阵"概念。</p>
            <div className="flex gap-4 items-center">
              <QuadrantsLogo variant="v3" size={60} />
              <QuadrantsLogo variant="v3" size={40} />
              <QuadrantsLogo variant="v3" size={24} />
            </div>
          </div>

          {/* Variant 4 */}
          <div className="border-3 border-black rounded-2xl p-8 shadow-bold bg-white">
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl">
              <QuadrantsLogo variant="v4" size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">V4: Q字母+阴影</h3>
            <p className="text-gray-600 mb-4">黄色背景，黑色阴影，粗体Q。符合现有Bold/Cute设计语言。</p>
            <div className="flex gap-4 items-center">
              <QuadrantsLogo variant="v4" size={60} />
              <QuadrantsLogo variant="v4" size={40} />
              <QuadrantsLogo variant="v4" size={24} />
            </div>
          </div>

          {/* Variant 5 — NEW (reference style) */}
          <div className="border-3 border-black rounded-2xl p-8 shadow-bold bg-white relative md:col-span-2">
            <span className="absolute -top-3 -right-3 bg-yellow-300 border-3 border-black rounded-full px-3 py-1 text-xs font-black -rotate-3">NEW</span>
            <div className="flex justify-center mb-6 bg-gray-50 p-10 rounded-xl">
              <QuadrantsLogo variant="v5" size={140} />
            </div>
            <h3 className="text-2xl font-bold mb-2">V5: 圆点网格 Q（参考风格）</h3>
            <p className="text-gray-600 mb-4">按你给的数字参考——用一条连续的圆头"圆点带"在网格上搭出一个 Q：八边形碗身 + 一条穿过右下角、向外探出的尾巴，明确读作 Q。点阵语言和 Matrix 的圆点背景一脉相承。</p>
            <div className="flex gap-6 items-center">
              <QuadrantsLogo variant="v5" size={60} />
              <QuadrantsLogo variant="v5" size={40} />
              <QuadrantsLogo variant="v5" size={24} />
            </div>
          </div>
        </div>

        {/* 使用场景预览 */}
        <div className="mt-16 border-3 border-black rounded-2xl p-8 shadow-bold-lg bg-gray-50">
          <h2 className="text-3xl font-black mb-8">实际使用效果预览</h2>

          {/* Header 预览 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Header 样式 (当前使用)</h3>
            <div className="bg-white border-b-3 border-black p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm">
                  <QuadrantsLogo variant="v1" size={40} />
                </div>
                <span className="text-2xl font-black text-black">Quadrants</span>
              </div>
            </div>
          </div>

          {/* 所有变体在Header中的效果 */}
          <div className="grid md:grid-cols-2 gap-6">
            {(['v1', 'v2', 'v3', 'v4', 'v5'] as const).map((variant) => (
              <div key={variant} className="bg-white border-2 border-gray-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm">
                    <QuadrantsLogo variant={variant} size={40} />
                  </div>
                  <span className="text-xl font-black text-black">Quadrants</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 bg-yellow-50 border-3 border-black rounded-xl">
          <p className="text-lg font-bold text-black">
            💡 提示：访问 <code className="bg-white px-2 py-1 rounded border-2 border-black">/logo-preview</code> 查看这个页面
          </p>
          <p className="text-gray-600 mt-2">
            选好后告诉我使用哪个版本(v1/v2/v3/v4/v5)，我会帮你替换到整个网站！v5 是这次按参考做的圆点网格新提案。
          </p>
        </div>
      </div>
    </div>
  )
}
