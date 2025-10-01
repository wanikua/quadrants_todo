# 🧪 测试指南

## ✅ RLS 已完成配置

所有数据库表已启用 Row-Level Security：
- ✅ 8个表全部启用 RLS
- ✅ 21个 RLS 策略已创建
- ✅ 6个性能索引已创建
- ✅ 辅助函数已创建

## 🚀 当前状态

### 已完成 ✅
1. **数据库 RLS 配置** - 完成
2. **Stack Auth (Neon Auth) 配置** - 完成
3. **环境变量设置** - 完成

### 待完成 ⏳
1. **Stripe 配置** - 需要配置
2. **测试认证流程** - 准备测试

## 📝 测试步骤

### 1. 测试 Stack Auth 认证

访问以下 URL：

\`\`\`
http://localhost:3000/handler/sign-up   # 注册页面
http://localhost:3000/handler/sign-in   # 登录页面
\`\`\`

**预期结果**：
- 看到 Stack Auth 的注册/登录界面
- 可以创建新用户
- 登录后重定向到 /projects

### 2. 测试数据隔离（RLS）

1. 创建第一个用户（用户A）
2. 登录并创建一些项目和任务
3. 退出登录
4. 创建第二个用户（用户B）
5. 登录并尝试查看数据

**预期结果**：
- 用户B 看不到用户A 的任何数据
- 每个用户只能看到自己的项目和任务

### 3. 测试团队协作

1. 用户A 创建一个项目
2. 用户A 邀请用户B 加入项目（需要先实现邀请功能）
3. 用户B 应该能看到共享的项目

### 4. 测试订阅（需要先配置 Stripe）

访问：
\`\`\`
http://localhost:3000/pricing
\`\`\`

## 🔧 配置 Stripe（可选）

如果要测试订阅功能，需要：

1. 访问 https://dashboard.stripe.com
2. 获取测试 API 密钥
3. 创建产品和价格
4. 更新 `.env.local` 中的 Stripe 环境变量
5. 安装 Stripe CLI：
   \`\`\`bash
   brew install stripe/stripe-cli/stripe
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   \`\`\`

## 🐛 故障排查

### 如果看到 "toClientJson" 错误
- 检查环境变量没有引号
- 重启开发服务器：`npm run dev`

### 如果 RLS 不工作
- 检查数据库连接
- 运行验证脚本：
  \`\`\`bash
  node scripts/verify-rls.js
  \`\`\`

### 如果 Stack Auth 不工作
- 检查 Neon 项目是否启用了 Auth
- 确认环境变量正确设置
- 查看浏览器控制台错误

## 📊 验证命令

\`\`\`bash
# 检查数据库表
node scripts/check-tables.js

# 验证 RLS 配置
node scripts/verify-rls.js

# 启动开发服务器
npm run dev
\`\`\`

## 🎯 下一步

1. **立即测试**：
   - 访问 http://localhost:3000
   - 尝试注册新用户
   - 创建项目和任务

2. **可选配置**：
   - 配置 Stripe 以测试订阅
   - 实现项目邀请功能
   - 添加更多 RLS 策略细化

3. **部署**：
   - 使用 Vercel 部署
   - 更新生产环境变量
   - 配置生产环境 Stripe webhook

## 🎉 完成！

你现在拥有一个完整的 SaaS 应用架构：
- ✅ 安全的用户认证（Stack Auth/Neon Auth）
- ✅ 数据隔离和权限控制（RLS）
- ✅ 订阅付费系统框架（Stripe）
- ✅ 团队协作准备就绪

开始测试吧！🚀
