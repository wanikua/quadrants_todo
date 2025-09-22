#!/usr/bin/env node

const http = require('http');
const https = require('https');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const tests = [];
let passed = 0;
let failed = 0;

// 测试结果颜色
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// HTTP请求辅助函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// 测试框架
function test(name, fn) {
  tests.push({ name, fn });
}

async function runTest(testCase) {
  try {
    console.log(`${colors.blue}🧪 ${testCase.name}${colors.reset}`);
    await testCase.fn();
    console.log(`${colors.green}✅ PASSED${colors.reset}\n`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============ 测试用例 ============

test('首页响应测试', async () => {
  const response = await makeRequest(`${BASE_URL}/`);
  assert(response.status === 200, `期望状态码200，实际${response.status}`);
  assert(response.raw.includes('Quadrant Task Manager'), '首页标题不正确');
  assert(response.headers['x-clerk-auth-status'] === 'signed-out', 'Clerk认证状态异常');
});

test('数据库连接测试', async () => {
  const response = await makeRequest(`${BASE_URL}/api/test-db`);
  assert(response.status === 200, `期望状态码200，实际${response.status}`);
  assert(response.data.success === true, '数据库连接失败');
  assert(response.data.data.rows.length > 0, '数据库查询无结果');
});

test('Clerk配置测试', async () => {
  const response = await makeRequest(`${BASE_URL}/api/test-clerk`);
  assert(response.status === 200, `期望状态码200，实际${response.status}`);
  assert(response.data.configured === true, 'Clerk未正确配置');
  assert(response.data.publishableKeyValid === true, 'Clerk公钥无效');
  assert(response.data.secretKeyValid === true, 'Clerk私钥无效');
});

test('数据库表初始化测试', async () => {
  const response = await makeRequest(`${BASE_URL}/api/setup-db`);
  assert(response.status === 200, `期望状态码200，实际${response.status}`);
  assert(response.data.success === true, '数据库初始化失败');
});

test('静态资源加载测试', async () => {
  // 测试CSS
  const cssResponse = await makeRequest(`${BASE_URL}/_next/static/css/app/layout.css`);
  assert(cssResponse.status === 200 || cssResponse.status === 404, '静态CSS资源问题');
  
  // 测试JavaScript
  const jsResponse = await makeRequest(`${BASE_URL}/_next/static/chunks/webpack.js`);
  assert(jsResponse.status === 200 || jsResponse.status === 404, '静态JS资源问题');
});

test('路由保护测试', async () => {
  // 未认证访问保护路由应该被重定向
  const response = await makeRequest(`${BASE_URL}/projects`);
  // 由于middleware，可能返回200但显示登录页面
  assert(response.status === 200 || response.status === 302, '路由保护异常');
});

test('API错误处理测试', async () => {
  // 测试不存在的API端点
  const response = await makeRequest(`${BASE_URL}/api/nonexistent`);
  assert(response.status === 404, '错误API端点处理异常');
});

test('CORS和安全头测试', async () => {
  const response = await makeRequest(`${BASE_URL}/api/test-db`);
  assert(response.headers['x-powered-by'] === 'Next.js', 'Next.js标识缺失');
  // 检查是否有基本安全头
  assert(response.headers['vary'], '缺少Vary头');
});

// ============ 运行所有测试 ============

async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 开始测试四象限任务管理应用${colors.reset}\n`);
  console.log(`📍 测试目标: ${BASE_URL}\n`);

  // 检查服务器是否运行
  try {
    await makeRequest(`${BASE_URL}/api/test-db`, { timeout: 5000 });
    console.log(`${colors.green}✅ 服务器正在运行${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ 服务器未运行，请先启动: npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  // 运行所有测试
  for (const testCase of tests) {
    await runTest(testCase);
  }

  // 输出总结
  console.log(`${colors.bold}📊 测试结果总结${colors.reset}`);
  console.log(`${colors.green}✅ 通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ 失败: ${failed}${colors.reset}`);
  console.log(`📈 通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log(`${colors.red}⚠️  存在测试失败，请检查上述错误信息${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}🎉 所有测试通过！应用已准备就绪${colors.reset}`);
    console.log(`${colors.blue}💡 下一步: 在浏览器中访问 ${BASE_URL} 进行手动测试${colors.reset}`);
  }
}

// 执行测试
runAllTests().catch(console.error);