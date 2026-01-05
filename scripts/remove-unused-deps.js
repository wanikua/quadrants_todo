#!/usr/bin/env node

/**
 * 手动清理未使用的依赖
 * 由于项目使用 pnpm workspace,需要先安装 pnpm
 */

const fs = require('fs');
const path = require('path');

console.log('📦 准备清理未使用的依赖...\n');

// 读取 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 要移除的依赖列表
const depsToRemove = [
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
    'expo-sqlite',
    '@op-engineering/op-sqlite',
    'fs',
    'http',
    'https',
    'url',
    'path',
    'gel',
    'bun-types',
];

let removedCount = 0;

// 从 dependencies 中移除
depsToRemove.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
        delete packageJson.dependencies[dep];
        removedCount++;
        console.log(`  ✓ 移除: ${dep}`);
    }
});

if (removedCount === 0) {
    console.log('✅ 没有找到需要移除的依赖');
    process.exit(0);
}

// 写回 package.json
fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
);

console.log(`\n✅ 成功移除 ${removedCount} 个依赖包`);
console.log('\n📝 下一步操作:');
console.log('1. 安装 pnpm (如果还没安装):');
console.log('   npm install -g pnpm');
console.log('');
console.log('2. 重新安装依赖:');
console.log('   pnpm install');
console.log('');
console.log('3. 测试应用:');
console.log('   pnpm dev');
console.log('');
console.log('4. 如果一切正常,提交更改:');
console.log('   git add package.json pnpm-lock.yaml');
console.log('   git commit -m "chore: remove unused dependencies"');
