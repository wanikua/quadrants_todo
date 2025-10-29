# Stripe Webhook 修复报告

## 问题诊断

### 原始问题
- `checkout.session.completed` webhook 返回 500 错误
- Stripe 支付成功但用户订阅状态未更新

### 根本原因
数据库 `users` 表的 `subscription_status` 字段有 CHECK 约束：
```sql
CHECK ((subscription_status = ANY (ARRAY['free'::text, 'pro'::text, 'team'::text])))
```

**但 webhook 处理代码试图设置不允许的值：**
- ❌ `subscription_status = 'active'` (checkout.session.completed)
- ❌ `subscription_status = ${stripeStatus}` (subscription.updated) - Stripe 返回 'active', 'trialing', 'past_due' 等
- ❌ `subscription_status = 'canceled'` (subscription.deleted)

## 修复方案

### 1. 添加状态映射函数
创建了 `mapStripeStatusToAppStatus()` 函数，将 Stripe 状态映射到应用状态：

```typescript
function mapStripeStatusToAppStatus(stripeStatus: string): 'free' | 'pro' | 'team' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'pro'
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'past_due':
    default:
      return 'free'
  }
}
```

### 2. 修复 webhook 处理函数

#### handleCheckoutCompleted
```typescript
// Before: subscription_status = 'active' ❌
// After:  subscription_status = 'pro' ✅
```

#### handleSubscriptionUpdated
```typescript
// Before: subscription_status = ${status} ❌ (直接使用 Stripe 状态)
// After:  subscription_status = ${mapStripeStatusToAppStatus(status)} ✅
```

#### handleSubscriptionDeleted
```typescript
// Before: subscription_status = 'canceled' ❌
// After:  subscription_status = 'free' ✅
```

### 3. 添加详细错误日志
增强了所有 webhook 处理函数的日志输出，便于调试：
- 完整的 session 数据 JSON
- SQL 更新结果
- 状态转换日志（Stripe状态 -> 应用状态）

## 修改的文件

1. **`app/api/stripe/webhook/route.ts`** - 核心修复
   - 添加状态映射函数
   - 修复所有 webhook 处理函数
   - 增强错误日志

2. **`app/api/migrate-stripe/route.ts`** - 新增
   - 数据库迁移 API（添加 Stripe 字段）

3. **`app/api/check-users-table/route.ts`** - 新增（调试用）
   - 检查 users 表结构和数据

4. **`app/api/check-constraints/route.ts`** - 新增（调试用）
   - 查看数据库约束定义

5. **`app/api/test-webhook/route.ts`** - 新增（测试用）
   - 模拟 webhook 调用进行测试

## 测试结果

✅ 测试 webhook 成功通过：
```json
{
  "success": true,
  "user": {
    "subscription_status": "pro",
    "subscription_plan": "pro",
    "stripe_customer_id": "cus_test123",
    "stripe_subscription_id": "sub_test123"
  }
}
```

## 状态映射逻辑

| Stripe Status | App Status | 说明 |
|--------------|------------|------|
| active | pro | 订阅激活 |
| trialing | pro | 试用期 |
| canceled | free | 已取消 |
| incomplete | free | 未完成 |
| incomplete_expired | free | 未完成已过期 |
| unpaid | free | 未支付 |
| past_due | free | 逾期未付 |

## 下一步建议

### 1. 清理测试文件（可选）
```bash
rm app/api/test-webhook/route.ts
rm app/api/check-users-table/route.ts
rm app/api/check-constraints/route.ts
```

### 2. 测试真实 Webhook
使用 Stripe CLI 或 Dashboard 触发真实的 webhook 事件：
```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
stripe trigger checkout.session.completed
```

### 3. 监控生产环境
- 在 Stripe Dashboard 检查 webhook 日志
- 确认所有事件都返回 200 状态码
- 验证用户订阅状态正确更新

### 4. 考虑增强功能（可选）
- 添加 `stripe_subscription_status` 字段保存原始 Stripe 状态
- 实现更精细的状态管理（如 past_due 保持 pro 但显示警告）
- 添加 webhook 事件日志表用于审计

## 验证清单

- [x] 数据库表包含所有必需的 Stripe 字段
- [x] subscription_status 只使用允许的值（free/pro/team）
- [x] 所有 webhook 处理函数已修复
- [x] 添加了状态映射逻辑
- [x] 测试 webhook 成功通过
- [ ] 真实 webhook 测试
- [ ] 生产环境验证

## 技术细节

### 数据库约束
```sql
-- 现有约束
CHECK ((subscription_status = ANY (ARRAY['free'::text, 'pro'::text, 'team'::text])))

-- 字段列表
- stripe_customer_id: TEXT
- stripe_subscription_id: TEXT
- subscription_status: TEXT (free/pro/team)
- subscription_plan: TEXT
- subscription_period_end: TIMESTAMP
```

### Stripe Webhook 事件
应用当前处理的事件：
1. `checkout.session.completed` - 首次订阅完成
2. `customer.subscription.updated` - 订阅状态变更
3. `customer.subscription.deleted` - 订阅取消
4. `invoice.payment_succeeded` - 支付成功（日志）
5. `invoice.payment_failed` - 支付失败（日志）

---

**修复完成时间：** 2025-10-29
**测试状态：** ✅ 通过
**生产部署：** 待验证
