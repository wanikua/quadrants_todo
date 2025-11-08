# v0.dev 部署配置

## 当前部署（单一项目）

### 自动部署流程
```bash
git add .
git commit -m "update"
git push origin main
↓
v0.dev 自动检测
↓
自动构建和部署
↓
网站更新
```

### 配置文件
- `v0.config.json` - v0.dev配置
- `.env.local` - 环境变量（不提交到Git）

---

## 未来Monorepo部署配置

当我们转换为monorepo结构后，v0.dev配置将调整为：

### 目录结构（未来）
```
quadrants/                    # Git根目录
├── apps/
│   ├── web/                 # Next.js网页版
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   └── next.config.js
│   └── mobile/              # React Native（新增）
├── packages/
│   └── shared/              # 共享代码
├── v0.config.json           # 更新后的配置
└── package.json             # Workspace配置
```

### v0.config.json（Monorepo版本）
```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "devCommand": "cd apps/web && npm run dev",
  "framework": "nextjs",
  "rootDirectory": "apps/web"
}
```

### package.json（Workspace配置）
```json
{
  "name": "quadrants-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:web": "npm run dev --workspace=apps/web",
    "build:web": "npm run build --workspace=apps/web",
    "dev:mobile": "npm run dev --workspace=apps/mobile"
  }
}
```

---

## 关键要点

### ✅ 保持不变
1. 继续使用v0.dev部署
2. git push自动触发部署
3. 环境变量配置方式相同
4. 部署URL保持不变

### 🔄 将会改变
1. 构建命令指向 `apps/web`
2. 输出目录变为 `apps/web/.next`
3. workspace管理多个应用

### 📱 移动端（不影响网页部署）
- React Native应用独立构建
- 使用Expo EAS构建和分发
- 与v0.dev部署完全独立

---

## 迁移步骤（当monorepo就绪时）

### 步骤1: 更新v0.config.json
```bash
# 更新配置文件指向apps/web
```

### 步骤2: 推送到GitHub
```bash
git add .
git commit -m "chore: migrate to monorepo structure"
git push origin main
```

### 步骤3: 验证部署
```bash
# v0.dev自动检测新配置
# 检查构建日志确保成功
```

---

## 环境变量

确保在v0.dev项目设置中配置：

```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
QWEN_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 测试当前部署

```bash
# 本地测试
npm run build
npm run start

# 访问: http://localhost:3000

# 推送部署
git push origin main
```

---

## 故障排除

### 部署失败
1. 检查v0.dev构建日志
2. 验证package.json的scripts
3. 确保环境变量已配置

### Monorepo部署失败
1. 确认rootDirectory配置正确
2. 检查buildCommand路径
3. 验证workspace依赖解析

---

**更新日期**: 2025-11-09
**当前状态**: 单一项目 ✅
**未来计划**: Monorepo（网页+移动端）
