/** @type {import('next').NextConfig} */
const nextConfig = {
  // 性能优化
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    // 启用图片优化以提升性能
    unoptimized: false,
    // 使用现代图片格式
    formats: ['image/webp', 'image/avif'],
    // 响应式图片尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 允许的外部图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },

  // 生产环境优化
  compress: true,
  poweredByHeader: false,
}

export default nextConfig

