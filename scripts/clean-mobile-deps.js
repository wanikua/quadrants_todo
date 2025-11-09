#!/usr/bin/env node
/**
 * Remove mobile dependencies from root package.json
 * Run this if auto-sync adds them back
 */

const fs = require('fs');
const path = require('path');

const rootPkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

const mobileDeps = [
  '@expo/dom-webview',
  '@expo/metro-runtime',
  '@react-native-community/slider',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/bottom-tabs',
  'expo',
  'react-native',
  'react-native-paper',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-webview'
];

let cleaned = 0;

mobileDeps.forEach(dep => {
  if (pkg.dependencies && pkg.dependencies[dep]) {
    console.log(`❌ Removing ${dep}`);
    delete pkg.dependencies[dep];
    cleaned++;
  }
});

// Fix @quadrants/shared
if (pkg.dependencies['@quadrants/shared'] &&
    pkg.dependencies['@quadrants/shared'] !== 'workspace:*') {
  console.log('🔧 Fixing @quadrants/shared to workspace:*');
  pkg.dependencies['@quadrants/shared'] = 'workspace:*';
  cleaned++;
}

if (cleaned > 0) {
  fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`\n✅ Cleaned ${cleaned} dependencies from root package.json`);
  console.log('Run: pnpm install');
} else {
  console.log('✅ No mobile deps found - package.json is already clean!');
}
