# Quick Start - 快速开始指南

> 5分钟启动Quadrants完整系统（Web + Mobile）

---

## 🚀 一键启动

### 1. 启动Web后端

```bash
# 在项目根目录
pnpm dev
```

**访问**: http://localhost:3000

---

### 2. 启动Mobile应用

**在新终端**：

```bash
cd mobile
pnpm start
```

然后选择：
- 按 **`i`** → iOS模拟器
- 按 **`a`** → Android模拟器
- **扫码** → 在真机上用Expo Go测试

---

## 📱 真机测试配置

### iOS/Android真机

1. 下载 **Expo Go** App
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. 扫描终端显示的二维码

3. **修改API地址**（`mobile/App.tsx`）：
   ```typescript
   // 替换为你的电脑局域网IP
   api.setBaseUrl('http://192.168.1.100:3000');
   // 查看你的IP: ifconfig | grep "inet "
   ```

---

## 🧪 测试核心功能

### Quick Add（AI批量任务创建）⭐

1. 点击底部 **"⚡ 快速添加"** FAB按钮
2. 输入多个任务：
   ```
   完成项目报告
   修复登录bug
   @alice 设计新界面
   准备团队会议
   ```
3. 点击 **"🤖 智能分析"**
4. 查看AI预测的紧急度和重要度
5. 点击 **"创建 4 个任务"**

### Real-time Sync（实时同步）

1. **手机**上修改任务优先级
2. **Web浏览器**上查看（3秒内自动更新）
3. **反向测试**：Web修改 → 手机自动更新

---

## 🔧 常见问题

### Q: "Unable to resolve module @quadrants/shared"

**解决**：
```bash
# 回到根目录重新安装
cd ..
pnpm install
```

### Q: 手机连接不上API

**解决**：
1. 确保手机和电脑在同一WiFi
2. 查看电脑IP：
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```
3. 修改 `mobile/App.tsx`:
   ```typescript
   api.setBaseUrl('http://你的IP:3000');
   ```

### Q: Android模拟器无法连接localhost

**解决**：
```typescript
// mobile/App.tsx
// Android模拟器使用特殊IP
api.setBaseUrl('http://10.0.2.2:3000');
```

---

## 📂 项目结构

```
quadrants_todo/
├── app/                # Web应用（Next.js）
├── packages/shared/    # 共享代码（60-80%复用）
│   ├── types/          # 类型定义
│   ├── utils/          # 业务逻辑
│   └── api/            # API客户端
└── mobile/             # React Native应用
    └── src/screens/    # 4个screen
```

---

## 🎯 核心优势

### 一次修改，多端同步

修改 `packages/shared/utils/index.ts`:

```typescript
// 改变优先级计算公式
export function calculatePriorityScore(u: number, i: number) {
  return u * 0.4 + i * 0.6  // 重要度权重更高
}
```

**结果**: ✅ Web + Mobile **都自动更新**！

---

## 📚 完整文档

- **Web功能参考**: `CLAUDE.md`
- **Mobile开发指南**: `MOBILE_README.md`
- **开发总结**: `MOBILE_DEVELOPMENT_COMPLETE.md`

---

## 🆘 获取帮助

问题？查看文档或提issue！

---

**现在开始吧！** 🚀

```bash
# Terminal 1: Web
pnpm dev

# Terminal 2: Mobile
cd mobile && pnpm start
```
