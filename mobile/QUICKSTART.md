# Mobile App 快速启动指南

## 前置要求

1. Node.js 18+ 已安装
2. pnpm 已安装
3. Expo CLI（会自动安装）
4. iOS Simulator（Mac）或 Android Emulator

## 启动步骤

### 1. 安装依赖（如果还没安装）
```bash
cd /Users/lk./Downloads/quadrants_todo
pnpm install
```

### 2. 启动后端服务器（在另一个终端）
```bash
# 在项目根目录
pnpm dev
```

确保后端运行在 `http://localhost:3000`

### 3. 启动Mobile App
```bash
cd mobile
pnpm start
```

这会启动Expo开发服务器，显示一个二维码和选项。

### 4. 在模拟器中运行

#### iOS (Mac only)
按 `i` 键，或运行：
```bash
pnpm ios
```

#### Android
按 `a` 键，或运行：
```bash
pnpm android
```

#### 真机测试
1. 在手机上安装Expo Go app
2. 扫描终端显示的二维码

## 配置API地址

Mobile app目前配置为连接到：
```typescript
// mobile/App.tsx
api.setBaseUrl('http://192.33.198.67:3000');
```

**重要**: 如果使用真机测试，需要修改这个IP地址：

1. 获取你的本机IP地址：
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. 修改 `mobile/App.tsx` 第17行的IP地址：
   ```typescript
   api.setBaseUrl('http://YOUR_IP_ADDRESS:3000');
   ```

3. 确保手机和电脑在同一个WiFi网络

## 测试功能清单

### 基础流程
1. [ ] 打开App，查看登录界面
2. [ ] 点击"使用Google登录"
3. [ ] 完成OAuth登录流程
4. [ ] 看到项目列表界面

### 项目管理
5. [ ] 点击右下角"+"创建新项目
6. [ ] 输入项目名称和描述
7. [ ] 选择项目类型（个人/团队）
8. [ ] 创建成功，看到新项目出现在列表
9. [ ] 下拉刷新项目列表

### 任务管理
10. [ ] 点击进入某个项目
11. [ ] 查看任务列表（如果有任务）
12. [ ] 点击任务查看详情
13. [ ] 编辑任务描述和优先级
14. [ ] 保存修改
15. [ ] 下拉刷新任务列表

### 滑动操作
16. [ ] 在任务列表中，向左滑动某个任务
17. [ ] 看到绿色的"完成"按钮和红色的"删除"按钮
18. [ ] 点击"完成"按钮，任务被归档
19. [ ] 创建新任务后，滑动删除测试

### 快速添加（核心功能）
20. [ ] 点击右下角"快速添加"按钮
21. [ ] 输入多行任务文本，例如：
    ```
    完成项目报告
    修复登录bug
    @alice 设计新界面
    ```
22. [ ] 点击"智能分析"
23. [ ] 查看AI预测的优先级
24. [ ] 点击某个任务展开
25. [ ] 调整紧急度和重要度滑块
26. [ ] 点击"创建X个任务"
27. [ ] 返回任务列表，看到新创建的任务

### 评论功能
28. [ ] 打开任务详情
29. [ ] 滚动到评论部分
30. [ ] 输入你的名字
31. [ ] 输入评论内容
32. [ ] 点击"发送评论"
33. [ ] 看到新评论出现在列表中

### 实时同步
34. [ ] 保持App打开
35. [ ] 在网页版修改某个任务
36. [ ] 等待3秒，看到Mobile App自动更新

## 故障排查

### 无法连接到服务器
- 检查后端是否运行（http://localhost:3000）
- 检查IP地址配置是否正确
- 检查防火墙设置
- 尝试重启Expo开发服务器

### Clerk登录失败
- 检查`.env`文件中的Clerk配置
- 确保`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`正确设置
- 检查Clerk控制台的OAuth设置

### 手势不工作
- 确保`react-native-gesture-handler`已正确安装
- 尝试完全重启App（关闭并重新打开）
- 检查是否正确包裹在`GestureHandlerRootView`中

### TypeScript错误
```bash
# 检查编译错误
npx tsc --noEmit

# 如果有错误，查看具体信息并修复
```

### 依赖问题
```bash
# 清理并重新安装
cd mobile
rm -rf node_modules
pnpm install
```

## 开发工具

### React Query Devtools
目前未启用，如需调试可添加：
```bash
pnpm add @tanstack/react-query-devtools
```

### Expo开发菜单
在模拟器中：
- iOS: Cmd + D
- Android: Cmd + M (Mac) / Ctrl + M (Windows)

在真机上：
- 摇晃设备

### 刷新App
- iOS: Cmd + R
- Android: R + R（双击R键）

## 性能提示

1. **首次加载较慢** - Expo需要编译和加载依赖，后续会更快
2. **真机测试更准确** - 模拟器性能可能与真机不同
3. **网络延迟** - 本地测试时延迟很低，生产环境会更慢

## 下一步

完成测试后：
1. 记录发现的问题
2. 检查FEATURES.md中的功能清单
3. 参考OPTIMIZATION_SUMMARY.md了解技术细节
4. 根据需要进行进一步优化

## 联系支持

如果遇到问题：
1. 检查控制台错误信息
2. 查看Expo开发服务器日志
3. 检查后端服务器日志
4. 参考Expo和React Native官方文档
