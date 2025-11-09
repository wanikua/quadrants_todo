#!/usr/bin/env node
/**
 * Verify that root package.json doesn't contain mobile dependencies
 * These should only be in mobile/package.json
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

const found = mobileDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);

if (found.length > 0) {
  console.error('\n❌ ERROR: Mobile dependencies found in root package.json!');
  console.error('These should ONLY be in mobile/package.json:\n');
  found.forEach(dep => console.error(`  - ${dep}`));
  console.error('\nRun: node scripts/clean-mobile-deps.js\n');
  process.exit(1);
}

// Check @quadrants/shared is using workspace protocol
if (pkg.dependencies['@quadrants/shared'] &&
    pkg.dependencies['@quadrants/shared'] !== 'workspace:*') {
  console.error('\n⚠️  WARNING: @quadrants/shared should use "workspace:*"');
  console.error(`Current: ${pkg.dependencies['@quadrants/shared']}`);
  console.error('Run: node scripts/clean-mobile-deps.js\n');
  process.exit(1);
}

console.log('✅ Root package.json is clean (no mobile deps)');
