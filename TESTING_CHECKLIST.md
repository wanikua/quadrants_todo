# Testing Checklist

## ✅ 已完成的修复

### 1. 数据库Schema修复
- ✅ 删除错误的CHECK约束
- ✅ 更新所有subscription_status数据为'active'
- ✅ 添加正确的CHECK约束: `('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')`

### 2. 代码逻辑修复
- ✅ projects-page-client.tsx: 使用正确的 `subscription_status === 'active'`
- ✅ dashboard-client.tsx: 使用正确的 `subscription_status === 'active'`
- ✅ api/check-user/route.ts: 使用正确的检查逻辑

### 3. 认证修复
- ✅ 切换到Clerk开发环境keys
- ✅ 修复sign out功能（使用Clerk的signOut）

### 4. 性能优化
- ✅ 实现乐观更新（任务创建/拖拽/删除立即响应）
- ✅ 减少不必要的router.refresh()调用

## 📋 需要测试的功能

请在浏览器中逐一测试以下功能：

### A. 认证功能
- [ ] 1. 访问 http://localhost:3001/api/check-user
  - 应该显示：`"isPro": true`
  - subscription_status 应该是 "active"
  - subscription_plan 应该是 "pro"

### B. Dashboard页面 (http://localhost:3001/dashboard)
- [ ] 2. Current Plan 显示
  - 应该显示 "Pro Plan" 图标
  - 应该显示 Pro features
- [ ] 3. Sign Out 按钮
  - 点击应该能正常登出
  - 应该跳转到首页

### C. Projects页面 (http://localhost:3001/projects)
- [ ] 4. 项目限制
  - Pro用户应该可以创建无限项目
  - 不应该看到升级提示
- [ ] 5. 创建项目
  - 创建新项目应该成功
  - 不应该被限制

### D. 任务管理 (进入任意项目)
- [ ] 6. 创建任务
  - 点击"Add Task"创建任务
  - 任务应该**立即**显示在界面上（乐观更新）
  - 不应该有延迟

- [ ] 7. 拖拽任务（桌面端）
  - 用鼠标拖动任务到不同位置
  - 任务应该**立即**移动（乐观更新）
  - 不应该有延迟

- [ ] 8. 删除任务
  - 拖动任务到右下角红色垃圾桶
  - 应该弹出确认对话框
  - 确认后任务应该**立即**消失

- [ ] 9. 编辑任务
  - 点击任务打开详情
  - 修改描述/urgency/importance
  - 保存后应该**立即**更新

### E. 长按创建（移动端功能测试）
- [ ] 10. 在矩阵空白处长按（0.8秒）
  - 应该弹出创建任务对话框
  - urgency和importance应该自动设置为长按位置

### F. 连线功能
- [ ] 11. 点击Settings -> "Connect Tasks"
  - 进入连线模式
  - 点击两个任务应该画出连线
  - 点击连线应该能删除

## 🎯 预期结果

所有功能都应该：
1. ⚡ **快速响应** - 无延迟，立即更新UI
2. 🎨 **正确显示** - Pro Plan正确识别和显示
3. 🔐 **认证正常** - Sign in/out 正常工作
4. 📱 **移动友好** - 触摸和长按功能正常

## 📝 测试后报告

请测试完成后告诉我：
- ✅ 哪些功能正常
- ❌ 哪些功能还有问题
- 🐛 发现的任何bug或异常

---

**测试环境：**
- URL: http://localhost:3001
- 用户: wlk760541031@gmail.com
- Plan: Pro (active)
