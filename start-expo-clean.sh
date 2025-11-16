#!/bin/bash
cd /Users/lk./Downloads/quadrants_todo/mobile
rm -rf .expo
WATCHMAN_DISABLED=1 npx expo start --clear --reset-cache
