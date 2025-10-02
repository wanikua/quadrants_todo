# 🎟️ 促销码系统使用指南

## ✅ 已完成功能

1. **促销码数据库** ✅
   - `promo_codes` 表 - 存储促销码
   - `promo_code_redemptions` 表 - 跟踪兑换记录
   - RLS 策略已配置
   - 性能索引已创建

2. **API 路由** ✅
   - `POST /api/promo/redeem` - 兑换促销码
   - `GET /api/promo/redeem?code=XXX` - 验证促销码

3. **用户界面** ✅
   - `/promo` - 促销码兑换页面
   - 验证和兑换功能
   - 显示可用促销���列表

## 🚀 如何使用

### 1. 访问促销码页面

\`\`\`
http://localhost:3000/promo
\`\`\`

### 2. 兑换促销码

1. 输入促销码（例如：`FREEPRO`）
2. 点击 "Validate" 验证码是否有效
3. 输入用户 ID（临时测试用，例如：`test-user-123`）
4. 点击 "Redeem Code" 兑换

### 3. 自动升级

兑换成功后，用户的 `subscription_status` 会自动更新为对应的计划！

## 🎫 预设促销码

| 代码 | 计划 | 期限 | 使用限制 |
|------|------|------|----------|
| `FREEPRO` | Pro | 永久 | 无限制 |
| `WELCOME2024` | Pro | 12个月 | 无限制 |
| `TEAM50` | Team | 6个月 | 50次 |
| `LIFETIME` | Team | 永久 | 10次 |

## 📋 数据库结构

### promo_codes 表
\`\`\`sql
- id: 主键
- code: 促销码（唯一）
- plan: 'pro' 或 'team'
- duration_months: 期限（NULL = 永久）
- max_uses: 最大使用次数（NULL = 无限）
- current_uses: 当前使用次数
- is_active: 是否激活
- expires_at: 过期时间
\`\`\`

### promo_code_redemptions 表
\`\`\`sql
- id: 主键
- promo_code_id: 促销码ID
- user_id: 用户ID
- redeemed_at: 兑换时间
- expires_at: 此次兑换的过期时间
\`\`\`

## 🔧 创建新促销码

### 方法 1: 直接插入数据库

\`\`\`sql
INSERT INTO promo_codes (code, plan, duration_months, max_uses, is_active)
VALUES ('NEWYEAR2025', 'pro', 12, 100, true);
\`\`\`

### 方法 2: 使用 Node.js 脚本

\`\`\`javascript
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

await sql`
  INSERT INTO promo_codes (code, plan, duration_months, max_uses)
  VALUES ('CUSTOM', 'team', NULL, 50)
`;
\`\`\`

## 🎯 促销码类型示例

### 1. 限时促销
\`\`\`sql
INSERT INTO promo_codes (code, plan, duration_months, max_uses, expires_at)
VALUES ('SUMMER2024', 'pro', 3, NULL, '2024-09-01'::timestamp);
\`\`\`

### 2. 限量促销
\`\`\`sql
INSERT INTO promo_codes (code, plan, duration_months, max_uses)
VALUES ('FIRST100', 'team', 12, 100);
\`\`\`

### 3. 永久会员
\`\`\`sql
INSERT INTO promo_codes (code, plan, duration_months, max_uses)
VALUES ('VIP', 'team', NULL, 10);
\`\`\`

### 4. 免费试用
\`\`\`sql
INSERT INTO promo_codes (code, plan, duration_months, max_uses)
VALUES ('TRIAL', 'pro', 1, NULL);
\`\`\`

## 📊 查看促销码使用情况

\`\`\`sql
-- 查看所有促销码及使用情况
SELECT
  code,
  plan,
  current_uses,
  max_uses,
  CASE
    WHEN max_uses IS NULL THEN 'Unlimited'
    ELSE (max_uses - current_uses)::text || ' remaining'
  END as availability
FROM promo_codes
WHERE is_active = true
ORDER BY current_uses DESC;
\`\`\`

## 🔒 安全特性

1. **防止重复兑换**
   - 每个用户每个促销码只能兑换一次
   - 数据库唯一约束确保

2. **自动验证**
   - 过期时间检查
   - 使用次数限制
   - 激活状态检查

3. **RLS 保护**
   - 用户只能查看自己的兑换记录
   - 防止未授权访问

## 🎨 集成到现有页面

### 在定价页面添加促销码输入

\`\`\`typescript
// 在 app/pricing/page.tsx 中添加
const [promoCode, setPromoCode] = useState("")

// 在支付按钮旁边添加
<Input
  placeholder="Promo code"
  value={promoCode}
  onChange={(e) => setPromoCode(e.target.value)}
/>
<Button onClick={handleRedeemPromo}>
  Apply Code
</Button>
\`\`\`

## 📈 统计和分析

### 查看最受欢迎的促销码
\`\`\`sql
SELECT
  c.code,
  c.plan,
  COUNT(r.id) as total_redemptions,
  c.max_uses
FROM promo_codes c
LEFT JOIN promo_code_redemptions r ON c.id = r.promo_code_id
GROUP BY c.id, c.code, c.plan, c.max_uses
ORDER BY total_redemptions DESC;
\`\`\`

### 查看用户兑换历史
\`\`\`sql
SELECT
  r.user_id,
  c.code,
  c.plan,
  r.redeemed_at,
  r.expires_at
FROM promo_code_redemptions r
JOIN promo_codes c ON r.promo_code_id = c.id
ORDER BY r.redeemed_at DESC;
\`\`\`

## 🛠️ 管理操作

### 停用促销码
\`\`\`sql
UPDATE promo_codes
SET is_active = false
WHERE code = 'OLDCODE';
\`\`\`

### 延长促销码有效期
\`\`\`sql
UPDATE promo_codes
SET expires_at = '2025-12-31'::timestamp
WHERE code = 'EXTEND';
\`\`\`

### 增加使用次数
\`\`\`sql
UPDATE promo_codes
SET max_uses = max_uses + 100
WHERE code = 'POPULAR';
\`\`\`

## 🎉 测试步骤

1. **访问页面**
   \`\`\`
   http://localhost:3000/promo
   \`\`\`

2. **测试兑换**
   - 输入 `FREEPRO`
   - 点击 Validate
   - 输入用户ID `test-001`
   - 点击 Redeem Code

3. **验证结果**
   \`\`\`sql
   SELECT * FROM users WHERE id = 'test-001';
   -- 应该看到 subscription_status = 'pro'
   \`\`\`

4. **测试重复兑换**
   - 再次尝试用相同用户兑换相同码
   - 应该提示 "已经兑换过"

## 💡 下一步扩展

- [ ] 创建管理后台生成促销码
- [ ] 批量生成促销码
- [ ] 促销码分析仪表板
- [ ] 邮件发送促销码
- [ ] 促销码推荐系统

---

🎊 促销码系统已完全就绪！用户现在可以通过输入促销码免费获得订阅！
