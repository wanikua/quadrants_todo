# Quadrants Mobile App - 开发文档

> React Native移动应用，支持iOS和Android

## 📱 项目概述

Quadrants移动应用是基于Eisenhower Matrix（艾森豪威尔矩阵）的任务管理系统的移动端实现。

### 核心特性

✅ **已实现功能**：
- 📋 **List View** - 按优先级排序的任务列表
- ⚡ **Quick Add** - AI驱动的批量任务创建（核心功能）
- 📝 **Task Detail** - 任务详情查看和编辑
- 🔄 **Real-time Sync** - 实时同步（每3秒）
- 👥 **Team Collaboration** - 团队协作和在线状态
- 🎨 **Material Design** - 使用React Native Paper

🚧 **计划中功能**：
- 🗺️ **Map View** (Tablet Only) - 四象限矩阵可视化
- 📊 **Statistics** - 任务统计和分析
- 🔔 **Push Notifications** - 推送通知
- 📴 **Offline Mode** - 离线模式

---

## 🏗️ 项目架构

```
quadrants_todo/                 # Monorepo根目录
├── app/                        # Next.js Web应用（根目录）
├── components/                 # Web组件
├── packages/
│   └── shared/                 # 🎯 共享代码包（60-80%复用）
│       ├── types/              # TypeScript类型定义
│       ├── utils/              # 业务逻辑工具
│       └── api/                # API客户端
└── mobile/                     # 📱 React Native应用
    ├── src/
    │   ├── screens/            # 屏幕组件
    │   │   ├── ProjectsScreen.tsx      # 项目列表
    │   │   ├── TaskListScreen.tsx      # 任务列表（主界面）
    │   │   ├── QuickAddScreen.tsx      # 快速添加（AI核心）
    │   │   └── TaskDetailScreen.tsx    # 任务详情
    │   ├── components/         # UI组件
    │   ├── hooks/              # 自定义Hooks
    │   └── utils/              # 工具函数
    └── App.tsx                 # 应用入口
```

### 代码复用率

| 模块 | 复用率 | 说明 |
|------|--------|------|
| **Types** | 100% | 所有数据模型共享 |
| **Business Logic** | 100% | 优先级计算、象限分类 |
| **API Client** | 100% | 所有HTTP请求 |
| **AI Features** | 100% | Quick Add核心逻辑 ⭐ |
| **Utilities** | 100% | 日期格式化、文本解析等 |
| **UI Components** | 0% | 平台特定（React vs React Native） |
| **总计** | **60-80%** | 极高的代码复用率 |

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm (推荐) 或 npm
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio + Android SDK

### 安装依赖

```bash
# 在根目录安装所有依赖（包括shared和mobile）
pnpm install

# 或单独安装mobile依赖
cd mobile
pnpm install
```

### 启动开发服务器

#### 方法1: 使用Expo (推荐)

```bash
cd mobile
pnpm start
```

然后选择：
- 按 `i` - 在iOS模拟器中打开
- 按 `a` - 在Android模拟器中打开
- 扫描二维码 - 在真机上使用Expo Go测试

#### 方法2: 直接运行

```bash
# iOS
cd mobile
pnpm ios

# Android
cd mobile
pnpm android
```

### 连接到后端API

**开发环境**：
- 默认连接到 `http://localhost:3000`
- 确保Web服务器正在运行（在根目录运行 `pnpm dev`）

**生产环境**：
- 修改 `mobile/App.tsx` 中的 `api.setBaseUrl()`
- 例如：`api.setBaseUrl('https://your-api.com')`

---

## 📖 核心功能使用指南

### 1. 项目列表（Projects Screen）

**功能**：
- 查看所有项目（个人 + 团队）
- 点击进入项目任务列表
- 创建新项目（即将推出）

**实现位置**：`src/screens/ProjectsScreen.tsx`

---

### 2. 任务列表（Task List Screen）⭐主界面

**功能**：
- 按优先级自动排序（最高优先级在顶部）
- 显示任务象限标签（重要且紧急、重要不紧急等）
- 显示分配的团队成员（彩色头像）
- 实时同步（3秒刷新）
- 在线用户数显示（团队项目）
- 滑动操作：完成任务、删除任务

**核心代码**：
```typescript
// 使用shared包的工具函数
import { sortTasksByPriority, getQuadrantLabel } from '@quadrants/shared';

const sortedTasks = sortTasksByPriority(tasks); // 自动排序
const quadrant = getQuadrantLabel(urgency, importance); // 获取象限
```

**实现位置**：`src/screens/TaskListScreen.tsx`

---

### 3. 快速添加（Quick Add）⭐核心AI功能

这是整个系统的**核心功能**，100%复用Web版逻辑。

**工作流程**：

1. **输入任务**（支持多种格式）：
   ```
   完成项目报告
   修复登录bug
   @alice 设计新界面
   @bob, @charlie 代码审查
   ```

2. **AI智能分析**：
   - 点击"🤖 智能分析"按钮
   - AI自动预测每个任务的紧急度和重要度
   - 支持@mention自动分配成员
   - 提供AI推理说明

3. **预览和调整**：
   - 查看AI预测结果
   - 可手动删除不需要的任务
   - 可调整优先级（点击任务展开详情）

4. **批量创建**：
   - 点击"创建 N 个任务"
   - 所有任务并行创建
   - 自动返回任务列表

**核心代码**（100%共享）：
```typescript
import {
  api,
  splitTaskText,      // 文本分割
  parseMentions,      // @mention解析
  TaskPrediction,
} from '@quadrants/shared';

// 1. 分割任务
const taskTexts = splitTaskText(inputText); // 换行、逗号、句号分隔

// 2. AI预测
const predictions = await api.predictTaskPriorities(taskTexts, projectId);

// 3. 批量创建
await Promise.all(
  predictions.map(task =>
    api.createTask(projectId, task.description, task.urgency, task.importance)
  )
);
```

**支持的分隔符**：
- 换行符 `\n`
- 逗号 `,`
- 句号 `。` `.`
- 分号 `;` `；`

**@mention语法**：
- `@alice 任务描述` - 分配给alice
- `任务描述 @bob` - 分配给bob
- `@alice, @bob 任务` - 分配给多人
- `@all 任务` - 分配给所有成员

**实现位置**：`src/screens/QuickAddScreen.tsx`

---

### 4. 任务详情（Task Detail）

**功能**：
- 查看任务完整信息
- 编辑任务描述
- 调整紧急度和重要度滑块（0-100）
- 查看分配的成员
- 查看评论
- 完成任务 / 删除任务

**交互流程**：
1. 点击"编辑任务"进入编辑模式
2. 修改描述、拖动滑块调整优先级
3. 点击"保存修改"提交
4. 使用乐观更新（立即反馈，后台同步）

**实现位置**：`src/screens/TaskDetailScreen.tsx`

---

## 🔄 实时同步机制

### 自动同步

**Task List Screen**：
```typescript
useQuery({
  queryKey: ['project', projectId],
  queryFn: () => api.syncProjectData(projectId),
  refetchInterval: 3000, // 每3秒自动刷新
});
```

### 用户活动心跳

**团队项目**：
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    api.updateUserActivity(projectId); // 每2秒发送心跳
  }, 2000);

  return () => clearInterval(interval);
}, [projectId]);
```

### 冲突处理

- 使用React Query的缓存机制
- 乐观更新：UI立即响应
- 失败自动回滚
- 基于`updated_at`时间戳的并发控制

---

## 🎨 UI/UX设计原则

### Material Design 3

使用 **React Native Paper** 实现Material Design：

```typescript
import {
  Button,
  FAB,
  List,
  Chip,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
```

### 触摸优化

- 最小触摸区域：44x44 pt
- 滑动手势：左滑删除、右滑完成
- 长按：显示快捷菜单（计划中）
- 下拉刷新：手动同步（计划中）

### 颜色系统

**象限颜色**：
- 🔴 **重要且紧急**：红色 (`#ef4444`)
- 🟡 **重要不紧急**：黄色 (`#f59e0b`)
- 🔵 **紧急不重要**：蓝色 (`#3b82f6`)
- ⚪ **不紧急不重要**：灰色 (`#9ca3af`)

**成员颜色**（8种预设）：
```typescript
const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];
```

---

## 🧪 测试

### 运行测试

```bash
cd mobile
pnpm test
```

### 手动测试清单

#### Quick Add功能测试

- [ ] 输入单个任务并创建
- [ ] 输入多行任务（换行分隔）
- [ ] 输入用逗号分隔的任务
- [ ] 测试@mention语法（@alice 任务）
- [ ] 测试@all分配给所有人
- [ ] AI预测是否合理（紧急度、重要度）
- [ ] 手动调整预测后创建
- [ ] 删除某些预测任务后创建
- [ ] 空输入提示
- [ ] 网络错误处理

#### Real-time Sync测试

- [ ] 在手机上修改任务，Web端是否更新
- [ ] 在Web上修改任务，手机端是否更新
- [ ] 多用户同时在线，在线人数是否正确
- [ ] 离线后重新连接，数据是否同步
- [ ] 冲突处理（两端同时修改同一任务）

---

## 📦 依赖说明

### 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `expo` | ~54.0 | React Native框架 |
| `react-native` | 0.81.5 | 原生组件 |
| `react-native-paper` | ^5.14 | Material Design UI |
| `@react-navigation/native` | ^7.1 | 导航 |
| `@tanstack/react-query` | ^5.90 | 数据获取和缓存 |
| `@quadrants/shared` | workspace:* | 共享代码包 ⭐ |

### 共享包依赖

**@quadrants/shared** 提供：
- `types` - TypeScript类型
- `utils` - 工具函数（优先级计算、文本解析）
- `api` - API客户端（Task、Project、AI操作）

---

## 🐛 调试

### 查看日志

```bash
# Expo开发工具
cd mobile
pnpm start

# 然后按 m 打开菜单
# 选择 "Show console logs"
```

### React Native Debugger

1. 安装：`brew install --cask react-native-debugger`
2. 启动：打开React Native Debugger应用
3. 在Expo中按 `Cmd + D` (iOS) 或 `Cmd + M` (Android)
4. 选择 "Debug JS Remotely"

### 常见问题

#### 1. "Unable to resolve module"

```bash
# 清除缓存
cd mobile
pnpm start --clear
```

#### 2. "@quadrants/shared not found"

```bash
# 重新安装workspace依赖
cd ..
pnpm install
```

#### 3. "Network request failed"

- 检查API baseUrl是否正确
- iOS模拟器使用 `localhost`
- Android模拟器使用 `10.0.2.2`（电脑本机）
- 真机使用电脑的局域网IP（如 `192.168.1.100:3000`）

---

## 🔐 环境配置

### API配置

**开发环境**（`App.tsx`）：
```typescript
// iOS模拟器
api.setBaseUrl('http://localhost:3000');

// Android模拟器
api.setBaseUrl('http://10.0.2.2:3000');

// 真机（使用电脑IP）
api.setBaseUrl('http://192.168.1.100:3000');
```

**生产环境**：
```typescript
api.setBaseUrl('https://your-production-api.com');
```

### 认证

目前使用Web端的Clerk认证，移动端需要实现：
- OAuth登录流程
- Token存储（AsyncStorage）
- 自动刷新Token

---

## 📱 平板支持（计划中）

### Map View（平板专属）

**屏幕尺寸检测**：
```typescript
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const isTablet = width >= 768; // iPad Mini+
```

**功能**：
- 四象限矩阵可视化
- 拖拽任务改变优先级
- 长按创建新任务
- 拖拽到垃圾桶删除
- 拖拽到完成区域归档
- Organize功能（AI整理布局）

**实现状态**：🚧 开发中

---

## 🚀 发布

### iOS（App Store）

1. **配置**：
   ```bash
   cd mobile
   eas build:configure
   ```

2. **构建**：
   ```bash
   eas build --platform ios
   ```

3. **提交**：
   ```bash
   eas submit --platform ios
   ```

### Android（Google Play）

1. **配置**：
   ```bash
   eas build:configure
   ```

2. **构建**：
   ```bash
   eas build --platform android
   ```

3. **提交**：
   ```bash
   eas submit --platform android
   ```

---

## 📊 性能优化

### React Query缓存

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1分钟
      cacheTime: 300000, // 5分钟
      retry: 1,
    },
  },
});
```

### FlatList优化

```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(data, index) => ({
    length: 80, // 固定高度
    offset: 80 * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## 🤝 贡献指南

### 添加新功能

1. 在 `packages/shared` 中实现业务逻辑
2. 在 `mobile/src/screens` 中创建UI
3. 测试Web和Mobile两端
4. 提交PR

### 代码规范

- TypeScript严格模式
- ESLint + Prettier
- 组件使用函数式（Hooks）
- 避免内联样式，使用StyleSheet

---

## 📄 许可证

MIT

---

## 🆘 获取帮助

- GitHub Issues: [提交问题](https://github.com/your-repo/issues)
- Discord: [加入社区](https://discord.gg/your-discord)
- Email: support@quadrants.app

---

**开发版本**: v0.1.0
**最后更新**: 2025-11-09
**作者**: Claude Code
**状态**: 🚧 开发中

---

## 🎉 下一步

现在你已经了解了Mobile App的全部功能！开始开发：

```bash
# 1. 启动Web后端
pnpm dev

# 2. 在新终端启动Mobile
cd mobile
pnpm start

# 3. 选择模拟器或扫码真机测试
```

享受开发吧！🚀
