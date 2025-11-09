# Vercel 部署指南 - Quadrants项目

## 🎯 立即部署（当前单一项目）

### 快速开始（5分钟）

#### 1️⃣ 连接GitHub到Vercel

访问: https://vercel.com/new

\`\`\`bash
1. 点击 "Import Project"
2. 选择 "Import Git Repository"
3. 连接GitHub账号（如果还没连接）
4. 搜索并选择: wanikua/quadrants_todo
5. 点击 "Import"
\`\`\`

#### 2️⃣ 配置项目

Vercel会自动检测Next.js项目，无需修改默认配置：

\`\`\`
Framework Preset: Next.js ✅ (自动检测)
Root Directory: ./ ✅
Build Command: npm run build ✅ (自动)
Output Directory: .next ✅ (自动)
Install Command: npm install ✅ (自动)
\`\`\`

#### 3️⃣ 配置环境变量

在"Environment Variables"部分添加以下变量：

\`\`\`bash
# 数据库
DATABASE_URL=postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Clerk认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI服务
QWEN_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# 应用URL
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# 邮件服务（可选）
RESEND_API_KEY=re_...
EMAIL_FROM=info@quadrants.ch

# Stripe（可选）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

**💡 提示**: 所有环境都使用相同的值（Production, Preview, Development）

#### 4️⃣ 部署

点击 "Deploy" 按钮，等待2-3分钟。

✅ 部署完成后，您会看到：
\`\`\`
🎉 Your project is live!
https://quadrants-todo.vercel.app
\`\`\`

---

## 🔄 自动部署流程

### 每次代码推送都会自动部署

\`\`\`bash
# 1. 本地开发
npm run dev

# 2. 提交代码
git add .
git commit -m "feat: add new feature"

# 3. 推送到GitHub
git push origin main

# 4. Vercel自动触发 (无需任何操作)
↓ 自动构建
↓ 自动运行测试
↓ 自动部署
↓ 发送通知邮件

# 5. 几分钟后访问
https://quadrants-todo.vercel.app
\`\`\`

### 分支预览

\`\`\`bash
# 创建功能分支
git checkout -b feature/new-ui
git push origin feature/new-ui

# Vercel自动创建预览环境
↓ https://quadrants-todo-git-feature-new-ui.vercel.app

# 主分支不受影响
↓ https://quadrants-todo.vercel.app (生产环境)
\`\`\`

---

## 📱 未来Monorepo部署（准备就绪）

当转换为monorepo后，部署配置会自动适配：

### 目录结构
\`\`\`
quadrants/                           # Git根目录
├── apps/
│   ├── web/                        # Next.js网页版
│   │   ├── vercel.json             # Web部署配置
│   │   └── package.json
│   └── mobile/                     # React Native
├── packages/
│   └── shared/                     # 共享代码
├── turbo.json                      # Turborepo配置 ✅已创建
└── package.json                    # Workspace配置
\`\`\`

### Vercel自动检测monorepo

Vercel会自动：
1. 检测到Turborepo配置
2. 只构建变更的应用
3. 缓存未变更的包
4. 并行构建（如果有多个应用）

### Web应用配置（未来）

`apps/web/vercel.json`:
\`\`\`json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
\`\`\`

### 构建速度对比

| 场景 | 单一项目 | Monorepo (无变化) | Monorepo (只改web) |
|------|----------|-------------------|-------------------|
| 构建时间 | ~2分钟 | ~10秒(缓存) | ~2分钟 |

---

## 🛠️ Vercel CLI（可选）

### 安装

\`\`\`bash
npm install -g vercel
\`\`\`

### 登录

\`\`\`bash
vercel login
\`\`\`

### 本地预览

\`\`\`bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
\`\`\`

### 查看日志

\`\`\`bash
# 查看最新部署日志
vercel logs

# 实时日志
vercel logs --follow
\`\`\`

### 环境变量管理

\`\`\`bash
# 查看环境变量
vercel env ls

# 添加环境变量
vercel env add DATABASE_URL production

# 从.env.local拉取
vercel env pull .env.local
\`\`\`

---

## 🌍 自定义域名

### 绑定域名

1. 在Vercel项目设置中添加域名
\`\`\`
Vercel Dashboard → Settings → Domains
添加: quadrants.ch
\`\`\`

2. 在域名提供商添加DNS记录
\`\`\`
类型: A
名称: @
值: 76.76.21.21

类型: CNAME
名称: www
值: cname.vercel-dns.com
\`\`\`

3. 等待DNS传播（几分钟）

4. Vercel自动配置HTTPS证书 ✅

---

## 📊 性能监控

### Vercel Analytics

在 `app/layout.tsx` 添加：

\`\`\`typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
\`\`\`

安装依赖：
\`\`\`bash
npm install @vercel/analytics @vercel/speed-insights
\`\`\`

### 查看指标

\`\`\`
Vercel Dashboard → Analytics
- 页面浏览量
- Core Web Vitals
- 地理分布
- 设备分布
\`\`\`

---

## 🔐 安全配置

### 环境变量保护

✅ Vercel自动：
- 加密存储所有环境变量
- 在构建日志中隐藏敏感值
- 限制环境变量访问权限

### 推荐设置

\`\`\`bash
# 在Vercel项目设置中启用：
✅ Deployment Protection (保护预览部署)
✅ Password Protection (访问密码)
✅ Automatically Lock Editing (锁定编辑)
\`\`\`

---

## 🆘 故障排除

### 部署失败

**症状**: 部署失败，显示错误

**解决方案**:
\`\`\`bash
# 1. 查看构建日志
Vercel Dashboard → Deployments → [失败的部署] → Logs

# 2. 常见错误：
❌ "Module not found" → 检查依赖是否在package.json
❌ "Environment variable missing" → 在Vercel添加环境变量
❌ "Build failed" → 本地运行 npm run build 检查错误

# 3. 本地复现
vercel build
\`\`\`

### 环境变量不生效

**症状**: 代码中读取不到环境变量

**解决方案**:
\`\`\`bash
# 1. 确认环境变量名称正确
# 客户端变量必须以 NEXT_PUBLIC_ 开头

# 2. 重新部署
Vercel Dashboard → Deployments → Redeploy

# 3. 检查环境范围
Production / Preview / Development 都要设置
\`\`\`

### 构建缓存问题

**症状**: 代码更新了但网站没变化

**解决方案**:
\`\`\`bash
# 清除缓存重新部署
Vercel Dashboard → Settings → Clear Cache
\`\`\`

---

## 💰 费用说明

### 免费额度（Hobby Plan）

✅ 完全免费：
- 100GB 带宽/月
- 6000分钟构建时间/月
- 无限部署
- 自动HTTPS
- 边缘网络（CDN）

**足够个人项目和中小型团队使用！**

### Pro Plan（可选）

$20/月，包含：
- 1TB 带宽
- 更快的构建
- 团队协作功能
- 优先支持

---

## 🎯 最佳实践

### 1. 使用预览部署

\`\`\`bash
# 不要直接推送到main
git checkout -b feature/test
git push origin feature/test

# 在预览环境测试
# 确认无误后合并到main
\`\`\`

### 2. 环境变量分离

\`\`\`bash
# 开发环境
.env.local (本地)

# 预览环境
Vercel → Preview 环境变量

# 生产环境
Vercel → Production 环境变量
\`\`\`

### 3. 监控性能

\`\`\`bash
# 定期检查
Vercel Dashboard → Analytics → Core Web Vitals

# 目标：
LCP < 2.5s ✅
FID < 100ms ✅
CLS < 0.1 ✅
\`\`\`

---

## 🚀 下一步行动

### 立即完成（5分钟）

1. ✅ 访问 https://vercel.com/new
2. ✅ 导入 wanikua/quadrants_todo 仓库
3. ✅ 配置环境变量
4. ✅ 点击 Deploy

### 完成后

\`\`\`bash
# 测试部署
curl https://your-project.vercel.app

# 推送代码测试自动部署
git commit --allow-empty -m "test: trigger deployment"
git push origin main
\`\`\`

---

## 📚 参考资源

- Vercel文档: https://vercel.com/docs
- Next.js部署: https://nextjs.org/docs/deployment
- Turborepo指南: https://turbo.build/repo/docs
- GitHub Actions集成: https://vercel.com/docs/git/vercel-for-github

---

**配置完成日期**: 2025-11-09
**配置文件**:
- ✅ vercel.json
- ✅ turbo.json
- ✅ .vercelignore

**状态**: 立即可用，支持未来monorepo ✅
