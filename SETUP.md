# 🚀 Quadrants Todo - 完整设置指南

本指南将帮助你完成 Neon Auth + RLS + Stripe 订阅系统的完整配置。

## 📋 前置要求

- Node.js 18+
- 一个 Neon 账户 (https://neon.tech)
- 一个 Stripe 账户 (https://stripe.com)

## 🔧 步骤 1: 设置 Neon 数据库与认证

### 1.1 创建 Neon 项目并启用 Auth

1. 访问 https://pg.new 创建新的 Neon 项目
2. 在项目设置中启用 **Neon Auth** (Stack Auth 集成)
3. 记录以下信息：
   - `DATABASE_URL` (Neon 连接字符串)
   - `NEXT_PUBLIC_STACK_PROJECT_ID`
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - `STACK_SECRET_SERVER_KEY`

### 1.2 运行数据库迁移

在 Neon SQL Editor 中执行以下 SQL 脚本：

```bash
# 1. 首先运行基础表创建（如果还没有）
psql $DATABASE_URL < scripts/init-db.sql

# 2. 然后运行 RLS 配置脚本
psql $DATABASE_URL < scripts/enable-rls.sql
```

或者在 Neon Dashboard 的 SQL Editor 中直接粘贴并执行 `scripts/enable-rls.sql` 的内容。

## 💳 步骤 2: 设置 Stripe

### 2.1 获取 API 密钥

1. 登录 https://dashboard.stripe.com
2. 进入 **Developers > API keys**
3. 复制：
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

### 2.2 创建订阅产品和价格

1. 进入 **Products** 页面
2. 创建以下产品：

#### Pro 订阅
- 产品名称: "Pro Plan"
- 月付价格: $12/month
  - 复制 Price ID → `STRIPE_PRICE_ID_PRO_MONTHLY`
- 年付价格: $120/year (可选)
  - 复制 Price ID → `STRIPE_PRICE_ID_PRO_YEARLY`

#### Team 订阅
- 产品名称: "Team Plan"
- 月付价格: $29/month
  - 复制 Price ID → `STRIPE_PRICE_ID_TEAM_MONTHLY`
- 年付价格: $290/year (可选)
  - 复制 Price ID → `STRIPE_PRICE_ID_TEAM_YEARLY`

### 2.3 配置 Webhook

1. 进入 **Developers > Webhooks**
2. 点击 **Add endpoint**
3. 端点 URL: `https://your-domain.com/api/stripe/webhook`
   - 开发环境: 使用 Stripe CLI (见下文)
4. 选择以下事件:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 复制 **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## 🌍 步骤 3: 配置环境变量

编辑 `.env.local` 文件，填入你的实际值：

```bash
# Neon Database
DATABASE_URL=postgresql://...

# Stack Auth (Neon Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_actual_key
STACK_SECRET_SERVER_KEY=your_actual_secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_YEARLY=price_...

# App URL (生产环境)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🧪 步骤 4: 本地开发测试

### 4.1 安装 Stripe CLI (用于本地 webhook 测试)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/vX.XX.X/stripe_X.XX.X_linux_x86_64.tar.gz
tar -xvf stripe_X.XX.X_linux_x86_64.tar.gz
```

### 4.2 启动开发服务器

```bash
# 安装依赖
npm install

# 启动 Next.js 开发服务器
npm run dev

# 在另一个终端中，启动 Stripe webhook 转发
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 复制 webhook signing secret 到 .env.local 中的 STRIPE_WEBHOOK_SECRET
```

### 4.3 测试流程

1. 访问 http://localhost:3000
2. 点击注册，创建一个账户
3. 访问 http://localhost:3000/pricing 查看订阅计划
4. 使用 Stripe 测试卡进行测试:
   - 成功: `4242 4242 4242 4242`
   - 任意未来日期 + 任意 CVC
5. 完成支付后，检查用户订阅状态是否更新

## 🎯 步骤 5: 验证 RLS 策略

### 5.1 测试数据隔离

```sql
-- 在 Neon SQL Editor 中测试

-- 1. 设置当前用户上下文
SELECT set_current_user_id('user_id_from_stack_auth');

-- 2. 查询应该只返回该用户的项目
SELECT * FROM projects;

-- 3. 切换到另一个用户
SELECT set_current_user_id('another_user_id');

-- 4. 应该看到不同的项目
SELECT * FROM projects;
```

### 5.2 检查权限

```sql
-- 验证用户只能访问自己的数据
SELECT * FROM tasks WHERE project_id = 999; -- 应该返回空（如果不是你的项目）
```

## 📦 步骤 6: 部署到生产环境

### 6.1 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 在 Vercel Dashboard 中设置环境变量
# 使用生产环境的 Stripe 密钥（pk_live_ 和 sk_live_）
```

### 6.2 更新 Stripe Webhook

1. 在 Stripe Dashboard 中添加生产环境 webhook
2. URL: `https://your-domain.vercel.app/api/stripe/webhook`
3. 更新 `STRIPE_WEBHOOK_SECRET` 环境变量

## 🔐 安全检查清单

- [ ] 所有敏感密钥都在 `.env.local` 中（未提交到 Git）
- [ ] RLS 策略已启用并测试
- [ ] Stripe webhook 签名验证已启用
- [ ] 生产环境使用 `pk_live_` 和 `sk_live_` 密钥
- [ ] HTTPS 已在生产环境启用
- [ ] Stack Auth 回调 URL 已正确配置

## 🎨 功能说明

### 订阅计划

1. **Free Plan**
   - 1 个项目
   - 无限任务
   - 基础支持

2. **Pro Plan ($12/month)**
   - 10 个项目
   - 最多 5 个团队成员
   - 优先支持
   - 数据导出

3. **Team Plan ($29/month)**
   - 无限项目
   - 无限团队成员
   - 24/7 支持
   - 高级分析

### RLS 数据隔离

- 每个用户只能看到自己创建或被邀请的项目
- 团队成员可以协作同一个项目
- 项目所有者可以添加/删除成员
- 所有数据查询自动受 RLS 策略保护

## 🐛 故障排查

### 认证问题

```bash
# 检查 Stack Auth 配置
curl http://localhost:3000/handler/sign-in

# 应该看到登录页面
```

### Stripe 支付失败

```bash
# 检查 webhook 日志
stripe listen --print-secret

# 查看 Next.js 日志
npm run dev -- --verbose
```

### RLS 策略问题

```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 查看策略
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 📚 参考文档

- [Neon Auth Documentation](https://neon.com/docs/neon-auth)
- [Stack Auth Docs](https://docs.stack-auth.com)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 🎉 完成！

如果所有步骤都完成了，你现在应该有一个完整的：
- ✅ Neon 数据库与 Row-Level Security
- ✅ Stack Auth 用户认证系统
- ✅ Stripe 订阅支付系统
- ✅ 多项目、多团队协作功能

享受你的 Quadrants Todo 应用！ 🚀
