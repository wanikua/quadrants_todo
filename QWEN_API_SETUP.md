# Qwen API 配置指南 (阿里云通义千问)

## 为什么选择 Qwen？

相比 Claude/OpenAI，Qwen API 具有以下优势：

- 💰 **更低成本**：价格是 Claude 的 1/5 到 1/10
- 🇨🇳 **中文优化**：对中文任务理解更准确
- 🚀 **国内访问快**：无需VPN/代理
- 🎯 **多模型选择**：根据需求选择不同级别的模型

## 获取 API Key

### 1. 注册/登录阿里云

访问：https://dashscope.console.aliyun.com/

- 如果没有账号，需要先注册阿里云账号
- 需要完成实名认证（个人或企业）

### 2. 开通通义千问服务

1. 在控制台首页，找到「通义千问」产品
2. 点击「开通服务」
3. 选择付费方式：
   - **按量付费**（推荐新用户）：用多少付多少
   - **预付费资源包**：适合大量使用

### 3. 创建 API Key

1. 进入 [API-KEY 管理页面](https://dashscope.console.aliyun.com/apiKey)
2. 点击「创建新的 API-KEY」
3. 复制生成的 API Key（格式：`sk-xxxxxxxxxxxx`）
4. **重要**：保存好这个 key，关闭后无法再查看

### 4. 配置到项目

在项目根目录的 `.env.local` 文件中添加：

\`\`\`bash
QWEN_API_KEY=sk-your-actual-key-here
\`\`\`

### 5. 重启开发服务器

\`\`\`bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
\`\`\`

## 模型选择

在 `/app/api/ai/predict-tasks/route.ts` 中，可以修改使用的模型：

\`\`\`typescript
body: JSON.stringify({
  model: 'qwen-plus', // 改为以下任一模型
  // ...
})
\`\`\`

### 可选模型对比

| 模型 | 速度 | 质量 | 价格/1K tokens | 推荐场景 |
|------|------|------|----------------|----------|
| **qwen-turbo** | 最快 | 好 | ¥0.0008 | 简单任务，追求速度 |
| **qwen-plus** | 快 | 很好 | ¥0.004 | 平衡性能和成本（默认）|
| **qwen-max** | 较慢 | 最好 | ¥0.012 | 复杂任务，追求质量 |

**推荐**：使用 `qwen-plus`，性价比最高

## 费用说明

### 计费方式

- 按实际使用的 token 数量计费
- 1 个汉字 ≈ 1.5-2 tokens
- 1 个英文单词 ≈ 1 token

### 示例费用（使用 qwen-plus）

**单次批量创建任务（10个任务）：**
\`\`\`
输入：约 500 tokens（prompt + 10个任务描述）
输出：约 500 tokens（10个预测结果）
总计：1000 tokens ≈ ¥0.004 = $0.0006
\`\`\`

**月度使用（每天创建5次批量任务）：**
\`\`\`
每天：5次 × ¥0.004 = ¥0.02
每月：¥0.02 × 30 = ¥0.60 = $0.09
\`\`\`

### 免费额度

阿里云新用户通常有：
- 通义千问 100万 tokens 免费额度
- 可以免费使用约 1000 次批量任务创建

## 测试 API

### 方法1：在控制台测试

1. 进入 https://dashscope.console.aliyun.com/playground
2. 选择「通义千问」模型
3. 输入测试文本，验证 API 是否正常

### 方法2：使用 curl 测试

\`\`\`bash
# 使用国际版API（推荐，更好的全球访问）
curl -X POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-plus",
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'
\`\`\`

### 方法3：在项目中测试

启动开发服务器后，打开项目：
1. 点击「Bulk Add with AI」
2. 输入几个测试任务
3. 点击「Analyze Tasks with AI」
4. 检查服务器日志，确认使用了 Qwen API

## 常见问题

### Q: API Key 不工作

**A: 检查以下几点：**
1. API Key 是否正确复制（包括 `sk-` 前缀）
2. 是否已开通通义千问服务
3. 账户余额是否充足
4. 重启开发服务器

### Q: 提示余额不足

**A: 充值方法：**
1. 进入阿里云控制台
2. 点击右上角「费用」
3. 选择「充值」
4. 推荐充值 ¥10-50 用于测试

### Q: 想要更准确的预测

**A: 两个方法：**
1. 将模型改为 `qwen-max`（成本提高3倍）
2. 使用系统一段时间，让 AI 学习你的习惯

### Q: 担心费用超支

**A: 设置预算告警：**
1. 进入阿里云「费用中心」
2. 设置「余额预警」
3. 当余额低于设定值时会收到通知

### Q: 国际用户无法访问

**A: 使用 Claude 作为替代：**
1. 注释掉 `QWEN_API_KEY`
2. 配置 `ANTHROPIC_API_KEY`
3. 系统会自动切换到 Claude

## API 文档

完整的 Qwen API 文档：
- 官方文档：https://help.aliyun.com/zh/dashscope/
- API 参考：https://help.aliyun.com/zh/dashscope/developer-reference/api-details
- 定价说明：https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-qianwen-metering-and-billing

## 支持

遇到问题？
- 阿里云工单系统
- 项目 issue: contact@quadrants.ch
- 查看服务器日志获取详细错误信息
