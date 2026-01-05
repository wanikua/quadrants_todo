#!/usr/bin/env node

/**
 * 清理未使用的依赖包
 * 这个脚本会识别并列出可能未使用的依赖
 */

const fs = require('fs');
const path = require('path');

// 读取 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 可能未使用的数据库客户端(只保留实际使用的)
const unusedDbClients = [
    '@aws-sdk/client-rds-data',
    '@planetscale/database',
    '@tidbcloud/serverless',
    '@xata.io/client',
    'mysql2',
    'postgres',
    'knex',
    'kysely',
    'better-sqlite3',
    'sqlite3',
    'sql.js',
    '@types/better-sqlite3',
    '@types/sql.js',
];

// 移动端相关依赖(Web应用不需要)
const mobileDeps = [
    'expo-sqlite',
    '@op-engineering/op-sqlite',
];

// 未使用的工具库
const unusedUtils = [
    'fs',
    'http',
    'https',
    'url',
    'path',
    'gel',
    'bun-types',
];

// 合并所有可能未使用的依赖
const potentiallyUnused = [
    ...unusedDbClients,
    ...mobileDeps,
    ...unusedUtils,
];

console.log('🔍 分析依赖包...\n');

const deps = { ...packageJson.dependencies };
const foundUnused = [];

potentiallyUnused.forEach(pkg => {
    if (deps[pkg]) {
        foundUnused.push(pkg);
    }
});

if (foundUnused.length === 0) {
    console.log('✅ 未发现明显的未使用依赖');
    process.exit(0);
}

console.log(`📦 发现 ${foundUnused.length} 个可能未使用的依赖:\n`);
foundUnused.forEach(pkg => {
    console.log(`  - ${pkg}`);
});

console.log('\n💡 建议操作:');
console.log('1. 确认这些包确实未使用');
console.log('2. 运行以下命令移除:');
console.log(`   pnpm remove ${foundUnused.join(' ')}`);
console.log('3. 测试应用确保功能正常');
console.log('4. 提交更改\n');

// 计算可节省的大小(估算)
const estimatedSavings = foundUnused.length * 2; // 平均每个包2MB
console.log(`📊 预计可减少 ~${estimatedSavings}MB 的 node_modules 大小\n`);
