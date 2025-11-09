# Quadrants项目部署指南

## 🎯 部署策略总览

### 当前（单一项目）→ Vercel/v0.dev
\`\`\`
Git Push → Vercel自动部署 → 网站上线
\`\`\`

### 未来（Monorepo）→ Vercel多应用部署
\`\`\`
Git Push → Vercel检测变更 → 只部署变更的应用
├── apps/web 改动 → 部署网页版
└── apps/mobile 改动 → 不影响网页版
\`\`\`

---

## 📦 方案1：当前单一项目部署（立即可用）

### Vercel部署（推荐）

#### 步骤1: 连接GitHub到Vercel
\`\`\`bash
1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 连接GitHub账号
4. 选择 wanikua/quadrants_todo 仓库
5. 点击 "Import"
\`\`\`

#### 步骤2: 配置环境变量
在Vercel项目设置中添加：
\`\`\`
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
QWEN_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
\`\`\`

#### 步骤3: 部署
\`\`\`bash
# 自动部署（推荐）
git push origin main
# Vercel自动检测并部署

# 或手动部署
npx vercel --prod
\`\`\`

**已配置**: `vercel.json` ✅

---

## 🏗️ 方案2：Monorepo部署配置

### 目录结构（未来）
\`\`\`
quadrants/
├── apps/
│   ├── web/              # Next.js网页版
│   │   ├── vercel.json   # Web部署配置
│   │   └── package.json
│   └── mobile/           # React Native移动版
│       └── app.json      # Expo配置
├── packages/
│   └── shared/           # 共享代码
├── turbo.json            # Turborepo配置
└── package.json          # Root workspace
\`\`\`

### Vercel配置（Monorepo）

**Root配置** (`quadrants/vercel.json`):
\`\`\`json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/apps/web/$1"
    }
  ]
}
\`\`\`

**Web应用配置** (`quadrants/apps/web/vercel.json`):
\`\`\`json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
\`\`\`

**Turborepo配置** (`quadrants/turbo.json`):
\`\`\`json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": [
        "DATABASE_URL",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
\`\`\`

---

## 🚀 部署流程（两种方案都适用）

### 自动部署（推荐）
\`\`\`bash
# 1. 开发功能
git add .
git commit -m "feat: add new feature"

# 2. 推送到GitHub
git push origin main

# 3. Vercel自动触发
# ✅ 自动构建
# ✅ 自动测试
# ✅ 自动部署到生产环境

# 4. 几分钟后访问
https://quadrants.vercel.app  # 或您的自定义域名
\`\`\`

### 手动部署（测试用）
\`\`\`bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
\`\`\`

---

## 🔄 从v0.dev迁移到Vercel

### 为什么迁移？
- ✅ Vercel是Next.js官方支持的平台
- ✅ 对Monorepo有原生支持
- ✅ 更好的性能和CDN
- ✅ 免费额度更慷慨
- ✅ 更好的团队协作功能

### 迁移步骤
\`\`\`bash
# 1. 在Vercel创建新项目
# 2. 连接GitHub仓库
# 3. 导入环境变量
# 4. 第一次部署（自动）

# 5. 删除v0.dev项目（可选）
\`\`\`

**注意**: v0.dev和Vercel可以同时存在，互不干扰。

---

## 📱 移动端构建和分发

### Expo应用发布（未来Monorepo后）

#### iOS发布
\`\`\`bash
cd apps/mobile
eas build --platform ios
eas submit --platform ios
\`\`\`

#### Android发布
\`\`\`bash
cd apps/mobile
eas build --platform android
eas submit --platform android
\`\`\`

#### OTA更新（无需重新提交应用商店）
\`\`\`bash
cd apps/mobile
eas update --branch production
\`\`\`

---

## 🔐 环境变量管理

### Vercel环境变量设置
\`\`\`bash
# 方法1：Web界面（推荐）
Vercel Dashboard → Project → Settings → Environment Variables

# 方法2：CLI
vercel env add DATABASE_URL production
vercel env add CLERK_SECRET_KEY production

# 方法3：从.env导入
vercel env pull .env.local
\`\`\`

### Expo环境变量（移动端）
\`\`\`bash
# 使用eas-cli配置
eas secret:create --name QWEN_API_KEY --value "sk-..."
eas secret:create --name DATABASE_URL --value "postgresql://..."
\`\`\`

---

## 🌍 自定义域名

### Vercel绑定域名
\`\`\`bash
# 1. 在Vercel添加域名
Vercel Dashboard → Project → Settings → Domains

# 2. 添加DNS记录（在您的域名提供商）
Type: CNAME
Name: www (或 @)
Value: cname.vercel-dns.com

# 3. 等待DNS传播（几分钟）
# 4. 自动配置HTTPS证书
\`\`\`

---

## 📊 部署监控

### Vercel Analytics
\`\`\`typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
\`\`\`

### 性能监控
\`\`\`bash
# Vercel自动提供：
- Core Web Vitals
- 响应时间
- 错误率
- 带宽使用
\`\`\`

---

## 🆘 故障排除

### 部署失败
\`\`\`bash
# 检查构建日志
vercel logs [deployment-url]

# 常见问题：
1. 环境变量缺失 → 在Vercel添加
2. 依赖安装失败 → 检查package.json
3. TypeScript错误 → 运行 npm run typecheck
\`\`\`

### 性能问题
\`\`\`bash
# 检查Vercel Analytics
# 优化建议：
1. 启用Edge Functions
2. 使用图片优化
3. 启用ISR (Incremental Static Regeneration)
\`\`\`

---

## 💡 最佳实践

### 分支部署策略
\`\`\`bash
# main分支 → 生产环境
git push origin main
→ https://quadrants.vercel.app

# develop分支 → 预览环境
git push origin develop
→ https://quadrants-git-develop.vercel.app

# 功能分支 → 临时预览
git push origin feature/new-ui
→ https://quadrants-git-feature-new-ui.vercel.app
\`\`\`

### 环境变量分离
\`\`\`bash
# 开发环境
.env.local (本地开发)

# 预览环境
Vercel Environment Variables → Preview

# 生产环境
Vercel Environment Variables → Production
\`\`\`

---

## ⏱️ 部署时间对比

| 方案 | 单一项目 | Monorepo (未改web) | Monorepo (改了web) |
|------|----------|-------------------|-------------------|
| Vercel | ~2分钟 | ~30秒(缓存) | ~2分钟 |
| v0.dev | ~3分钟 | 不支持 | 不支持 |

---

## 🎯 总结

### 当前推荐：Vercel
✅ 已配置vercel.json
✅ 推送即部署
✅ 完全兼容未来Monorepo

### 未来Monorepo：
✅ 网页版继续Vercel部署
✅ 移动版独立构建（Expo EAS）
✅ 共享代码自动同步
✅ 一次git push，所有平台更新

---

**下一步**:
1. 连接GitHub到Vercel
2. 配置环境变量
3. 推送代码，自动部署

**需要帮助?** 随时告诉我！
