# 订阅状态修复指南

## 🔍 问题诊断

### 根本原因
用户支付成功后没有升级到 Pro 的原因是 **订阅状态值不匹配**：

1. **Webhook** 之前设置 `subscription_status = 'pro'`
2. **前端检查** `subscription_status === 'active'`
3. **结果**: `'pro' !== 'active'` → 用户被识别为免费用户

### 受影响的代码位置
- `/app/api/stripe/webhook/route.ts:116` - Webhook 设置状态
- `/components/dashboard-client.tsx:43-44` - 前端检查状态
- `/components/projects-page-client.tsx:41` - 项目页面检查
- `/app/api/projects/route.ts:21` - API 检查状态

---

## ✅ 已完成的修复

### 1. Webhook 代码修复
**文件**: `/app/api/stripe/webhook/route.ts`

\`\`\`typescript
// ❌ 之前（错误）
subscription_status = 'pro',

// ✅ 现在（正确）
subscription_status = 'active',
\`\`\`

这确保新用户支付后会正确升级到 Pro。

### 2. 创建修复 API
**文件**: `/app/api/fix-subscription-status/route.ts`

这个 API 可以：
- 更新数据库约束，允许 'active' 状态
- 将现有用户从 'pro' 状态迁移到 'active'
- 返回修复结果和统计信息

---

## 🚀 修复步骤

### 方法 1：使用 API 修复（推荐）

#### 步骤 1: 检查当前状态
\`\`\`bash
curl http://localhost:3000/api/fix-subscription-status
\`\`\`

或在浏览器中访问：
\`\`\`
http://localhost:3000/api/fix-subscription-status
\`\`\`

**响应示例**：
\`\`\`json
{
  "success": true,
  "breakdown": {
    "total": 5,
    "active": 2,
    "pro": 3,      // ⚠️ 这些用户需要修复
    "other": 0
  },
  "needsFix": true,
  "users": [...]
}
\`\`\`

#### 步骤 2: 执行修复
\`\`\`bash
curl -X POST http://localhost:3000/api/fix-subscription-status
\`\`\`

**成功响应**：
\`\`\`json
{
  "success": true,
  "message": "Successfully fixed 3 user(s)",
  "fixed": 3,
  "users": [
    {
      "id": "user_xxx",
      "email": "user@example.com",
      "status": "active",
      "plan": "pro"
    }
  ],
  "verification": {
    "activeProUsers": 5
  }
}
\`\`\`

#### 步骤 3: 验证修复
让受影响的用户：
1. 退出登录
2. 重新登录
3. 访问 Dashboard 或 Projects 页面
4. 确认 Pro 功能已可用

---

### 方法 2：手动数据库修复

如果 API 方法失败，可以直接在数据库中执行：

\`\`\`sql
-- 1. 更新数据库约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;

ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
CHECK (subscription_status IN (
  'free', 'pro', 'team',
  'active', 'canceled', 'past_due', 'trialing',
  'incomplete', 'incomplete_expired', 'unpaid'
));

-- 2. 修复现有用户
UPDATE users
SET subscription_status = 'active',
    updated_at = NOW()
WHERE subscription_status = 'pro'
  AND subscription_plan = 'pro'
  AND stripe_subscription_id IS NOT NULL;

-- 3. 验证修复结果
SELECT id, email, subscription_status, subscription_plan
FROM users
WHERE subscription_plan = 'pro';
\`\`\`

---

## 📊 验证清单

完成修复后，验证以下内容：

### ✅ Webhook 正常工作
- [ ] 新用户支付后 `subscription_status` 设置为 `'active'`
- [ ] Dashboard 正确显示 Pro 状态
- [ ] Pro 功能（无限项目等）可用

### ✅ 现有用户已修复
- [ ] 所有 Pro 用户的 `subscription_status = 'active'`
- [ ] 没有用户卡在 `subscription_status = 'pro'`
- [ ] 用户可以访问所有 Pro 功能

### ✅ 前端状态正确
- [ ] Dashboard 显示 "Pro Plan" 徽章
- [ ] Projects 页面允许创建无限项目
- [ ] Stripe Portal 可以正常访问

---

## 🔧 测试支付流程

### 使用 Stripe 测试模式
\`\`\`bash
# 1. 启动开发服务器
npm run dev

# 2. 访问 Pricing 页面
open http://localhost:3000/pricing

# 3. 使用测试卡号支付
# 卡号: 4242 4242 4242 4242
# 日期: 任何未来日期
# CVC: 任何3位数字

# 4. 支付成功后检查：
curl http://localhost:3000/api/check-user
\`\`\`

**期望结果**：
\`\`\`json
{
  "user": {
    "subscription_status": "active",    // ✅ 应该是 'active'
    "subscription_plan": "pro",         // ✅ 应该是 'pro'
    "isPro": true                       // ✅ 应该是 true
  }
}
\`\`\`

---

## 🐛 故障排除

### 问题 1: API 返回 500 错误
**原因**: 数据库连接问题或权限不足

**解决方案**:
\`\`\`bash
# 检查数据库连接
DATABASE_URL="your-database-url" npx tsx -e "
  const { sql } = require('./lib/db.ts');
  sql\`SELECT 1\`.then(() => console.log('✅ DB OK'));
"
\`\`\`

### 问题 2: 约束冲突错误
**错误**: `violates check constraint "users_subscription_status_check"`

**解决方案**: 先删除旧约束
\`\`\`sql
ALTER TABLE users DROP CONSTRAINT users_subscription_status_check;
\`\`\`

### 问题 3: 修复后用户仍显示为 Free
**原因**: 缓存或会话问题

**解决方案**:
1. 清除浏览器缓存
2. 用户退出并重新登录
3. 检查数据库中的实际值：
\`\`\`sql
SELECT subscription_status, subscription_plan
FROM users
WHERE email = 'user@example.com';
\`\`\`

---

## 📝 状态值说明

### subscription_status 允许的值

| 值 | 含义 | 使用场景 |
|---|---|---|
| `free` | 免费用户 | 默认状态，未订阅 |
| `active` | 激活的订阅 | ✅ Pro 用户应该是这个 |
| `trialing` | 试用期 | Stripe 试用订阅 |
| `past_due` | 逾期未付 | 支付失败但宽限期内 |
| `canceled` | 已取消 | 用户取消订阅 |
| `incomplete` | 未完成 | 支付流程未完成 |
| `unpaid` | 未支付 | 长期未支付 |

### subscription_plan 值

| 值 | 含义 |
|---|---|
| `free` | 免费计划 |
| `pro` | Pro 计划 |
| `team` | 团队计划（未来） |

### 正确的 Pro 用户状态
\`\`\`typescript
subscription_status = 'active'   // ✅ 关键！
subscription_plan = 'pro'
stripe_subscription_id = 'sub_xxx'
\`\`\`

---

## 🎯 下一步行动

### 立即执行
1. [ ] 运行修复 API: `POST /api/fix-subscription-status`
2. [ ] 通知受影响用户重新登录
3. [ ] 测试一次完整的支付流程

### 监控
1. [ ] 在 Stripe Dashboard 检查 webhook 日志
2. [ ] 确认所有 `checkout.session.completed` 事件返回 200
3. [ ] 监控用户订阅状态更新

### 预防
1. [ ] 添加自动化测试验证订阅状态
2. [ ] 设置 webhook 事件监控告警
3. [ ] 定期检查用户订阅状态一致性

---

## 📞 需要帮助？

如果修复过程中遇到问题：

1. **检查日志**:
   - Webhook 日志: Stripe Dashboard → Developers → Webhooks
   - 应用日志: `console.log` 输出

2. **验证数据**:
   \`\`\`sql
   -- 检查用户表结构
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'users';

   -- 检查约束
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'users'::regclass;
   \`\`\`

3. **测试 Webhook**:
   \`\`\`bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   \`\`\`

---

**修复完成日期**: 2025-11-01
**修复文件**:
- `/app/api/stripe/webhook/route.ts`
- `/app/api/fix-subscription-status/route.ts`

✅ **修复状态**: 已完成，等待部署和测试
