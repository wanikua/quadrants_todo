# Mobile App 功能清单

## 已实现的功能

### 1. 用户认证
- ✅ Clerk OAuth 登录（Google）
- ✅ 自动token管理
- ✅ 安全存储（expo-secure-store）

### 2. 项目管理 (ProjectsScreen)
- ✅ 显示项目列表
- ✅ 个人/团队项目标识
- ✅ 创建新项目（对话框）
- ✅ 选择项目类型（个人/团队）
- ✅ 下拉刷新
- ✅ 优化的加载状态UI
- ✅ 优化的错误状态UI（带重试）

### 3. 任务列表 (TaskListScreen)
- ✅ 按优先级排序的任务列表
- ✅ 任务象限标签（重要紧急、重要不紧急等）
- ✅ 优先级分数显示
- ✅ 团队成员头像显示
- ✅ 实时同步（3秒间隔）
- ✅ 在线用户数显示
- ✅ 滑动删除任务（向左滑动显示删除按钮）
- ✅ 滑动完成任务（向左滑动显示完成按钮）
- ✅ 下拉刷新
- ✅ 优化的加载/错误状态UI

### 4. 任务详情 (TaskDetailScreen)
- ✅ 查看任务完整信息
- ✅ 编辑任务描述
- ✅ 调整紧急度（滑块）
- ✅ 调整重要度（滑块）
- ✅ 查看分配的团队成员
- ✅ 查看所有评论
- ✅ 添加新评论（内容 + 作者名称）
- ✅ 删除任务
- ✅ 完成任务（归档）
- ✅ 乐观更新（失败时恢复）
- ✅ 优化的加载状态UI

### 5. 快速添加任务 (QuickAddScreen) ⭐ 核心功能
- ✅ 批量文本输入
- ✅ 多种分隔符支持（换行、逗号、句号、分号）
- ✅ @mention 语法支持
- ✅ AI智能预测优先级
- ✅ 预测结果可视化
- ✅ 手动调整预测结果（展开滑块）
- ✅ 每个任务可展开/折叠
- ✅ AI推理解释显示
- ✅ 批量创建任务
- ✅ 删除单个预测任务

### 6. 实时协作
- ✅ 用户活动心跳（2秒间隔）
- ✅ 数据自动同步（3秒间隔）
- ✅ 在线用户数显示
- ✅ 冲突解决机制

### 7. UI/UX优化
- ✅ Material Design 3（react-native-paper）
- ✅ 统一的加载状态组件
- ✅ 统一的错误状态组件（带重试）
- ✅ 下拉刷新（所有列表）
- ✅ 滑动手势操作
- ✅ 响应式布局
- ✅ 空状态提示

## 技术架构

### 依赖包
- React 19.1.0
- React Native 0.81.5
- Expo ~54.0.23
- React Navigation 7.x（Native Stack）
- React Native Paper 5.14.5
- React Query 5.90.7
- Clerk Expo 2.19.0
- React Native Gesture Handler 2.29.1
- @react-native-community/slider 5.0.1

### 共享代码
- `@quadrants/shared` - 共享API客户端、类型定义、工具函数

### 状态管理
- React Query - 服务器状态管理、缓存、同步
- Local State - 组件内部状态（useState）

### 认证
- Clerk OAuth（Google登录）
- JWT token自动注入到API请求
- 安全存储token缓存

## 与网页版的差异

### 移除的功能
- ❌ Map View（四象限矩阵拖拽）- 手机屏幕太小
- ❌ Organize（智能整理）- 依赖Map View
- ❌ 任务连线功能

### 移动端专属功能
- ✅ 滑动删除/完成（Swipeable）
- ✅ 触摸优化的UI组件
- ✅ 下拉刷新手势

## API端点使用

### 项目相关
- GET /api/projects - 获取项目列表
- POST /api/projects - 创建项目
- GET /api/projects/[id]/sync - 同步项目数据
- POST /api/projects/[id]/activity - 更新用户活动

### 任务相关
- POST /api/tasks - 创建任务
- PATCH /api/tasks/[id] - 更新任务
- DELETE /api/tasks/[id] - 删除任务
- POST /api/tasks/[id]/complete - 完成任务

### AI功能
- POST /api/ai/predict-tasks - 预测任务优先级

### 评论相关
- POST /api/comments - 添加评论
- DELETE /api/comments/[id] - 删除评论

## 待优化项（可选）

1. 离线模式支持
2. 推送通知
3. 图片/附件上传
4. 任务搜索功能
5. 筛选和排序选项
6. 主题切换（深色模式）
7. 多语言支持
8. 性能监控和分析

## 测试清单

- [ ] 登录流程
- [ ] 创建项目
- [ ] 查看项目列表
- [ ] 进入任务列表
- [ ] 查看任务详情
- [ ] 编辑任务
- [ ] 添加评论
- [ ] 删除任务
- [ ] 完成任务
- [ ] 快速添加任务（AI预测）
- [ ] 手动调整预测优先级
- [ ] 批量创建任务
- [ ] 滑动删除任务
- [ ] 滑动完成任务
- [ ] 下拉刷新
- [ ] 实时同步
- [ ] 错误处理和重试
