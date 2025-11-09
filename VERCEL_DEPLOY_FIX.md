# Vercel部署问题修复指南

## 🔴 问题现象

Vercel部署失败，错误信息：
\`\`\`
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date

* 11 dependencies were added: @expo/dom-webview, @react-native-community/slider, expo, react-native, etc.
\`\`\`

## 🔍 问题根源

**根本原因**：有自动同步进程在反复将mobile依赖添加到根目录的`package.json`

**证据**：
\`\`\`bash
git log --grep="sync.*main" --oneline
# 显示大量 "feat: sync updates from main in quadrants_todo" 提交
\`\`\`

这些mobile依赖应该**只存在于** `mobile/package.json`，但被自动同步到了根目录。

---

## ✅ 立即修复方法

### 方法1: 使用清理脚本（推荐）

\`\`\`bash
# 清理mobile依赖
pnpm run clean-deps

# 提交修复
git add package.json pnpm-lock.yaml
git commit -m "fix: remove mobile deps from root package.json"
git push
\`\`\`

### 方法2: 手动验证

\`\`\`bash
# 验证package.json是否干净
pnpm run verify-deps

# 如果失败，运行清理脚本
pnpm run clean-deps
\`\`\`

---

## 🛡️ 防止问题再次发生

### 1. 禁用自动同步（临时方案）

如果你有GitHub Actions或其他自动同步工具在运行，暂时禁用它们：

\`\`\`bash
# 检查是否有GitHub Actions
ls .github/workflows/

# 如果有，暂时禁用相关workflow
\`\`\`

### 2. 修复同步源（永久方案）

如果你从其他仓库同步代码，确保**源仓库**也有正确的项目结构：

**源仓库应该：**
\`\`\`
根package.json → 只有Web依赖 + @quadrants/shared
mobile/package.json → 所有mobile依赖
packages/shared/package.json → 无依赖
\`\`\`

### 3. 添加pre-commit钩子（自动保护）

已创建 `.husky/pre-commit`，在每次提交前自动验证：

\`\`\`bash
# 安装husky
pnpm add -D husky
pnpm husky install

# 测试钩子
git add .
git commit -m "test"
# 如果有mobile依赖，会自动阻止提交
\`\`\`

---

## 📋 验证清单

运行以下命令验证配置正确：

\`\`\`bash
# ✅ 1. 验证根package.json没有mobile依赖
pnpm run verify-deps

# ✅ 2. 检查mobile依赖在正确位置
cat mobile/package.json | grep "react-native"

# ✅ 3. 验证workspace配置
cat pnpm-workspace.yaml

# ✅ 4. 测试本地构建
pnpm build
\`\`\`

---

## 🚀 正确的项目结构

\`\`\`
quadrants_todo/
├── package.json                 # ⚠️ 只有Web依赖
│   └── dependencies:
│       ├── next, react, etc.    ✅ Web框架
│       ├── @clerk/nextjs        ✅ Web认证
│       ├── @quadrants/shared    ✅ workspace:*
│       └── ❌ NO expo/react-native!
│
├── mobile/
│   └── package.json             # ⚠️ 只有Mobile依赖
│       └── dependencies:
│           ├── expo, react-native ✅
│           ├── @react-navigation  ✅
│           └── @quadrants/shared  ✅ workspace:*
│
└── packages/shared/
    └── package.json             # ⚠️ 无依赖（纯TS）
\`\`\`

---

## 🔧 可用脚本

### `pnpm run verify-deps`
验证根package.json没有mobile依赖

### `pnpm run clean-deps`
自动清理mobile依赖并更新lockfile

### `pnpm run prebuild`
构建前自动验证（已配置）

---

## 📊 Vercel配置

**当前配置**（正确）：
\`\`\`json
// .vercelignore
mobile/                    # ✅ 排除mobile目录
packages/shared/node_modules  # ✅ 排除shared node_modules
\`\`\`

**Vercel构建流程**：
1. Clone代码
2. 检测workspace（root + shared）
3. 排除mobile/（通过.vercelignore）
4. 运行 `pnpm install --frozen-lockfile`
5. 运行 `pnpm run prebuild`（自动验证）
6. 运行 `pnpm build`

---

## 🆘 如果仍然失败

### 检查远程commit
\`\`\`bash
git fetch
git log origin/main -5 --oneline

# 检查最新commit的package.json
git show origin/main:package.json | grep -E "(expo|react-native)"
\`\`\`

### 强制修复
\`\`\`bash
# 1. 清理本地
pnpm run clean-deps

# 2. 强制提交
git add -A
git commit -m "fix: FORCE remove mobile deps"
git push --force-with-lease
\`\`\`

### 联系支持
如果问题持续，检查：
1. 是否有其他人在同时推送
2. 是否有CI/CD在自动修改package.json
3. 是否有git hooks在运行

---

## 📝 相关文件

- `scripts/verify-no-mobile-deps.js` - 验证脚本
- `scripts/clean-mobile-deps.js` - 清理脚本
- `.husky/pre-commit` - Git钩子
- `.vercelignore` - Vercel忽略配置

---

**最后更新**: 2025-11-09
**状态**: 已修复，已添加自动保护
