import withPWAInit from "@ducanh2912/next-pwa";
import i18nConfig from "./next-i18next.config.js";

const withPWA = withPWAInit({
  dest: "public",       // 서비스 워커 파일이 생성될 위치
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // 개발 중에는 끄기
  workboxOptions: {
    disableDevLogs: true,
    exclude: [/dynamic-css-manifest\.json$/],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: i18nConfig.i18n,
  reactCompiler: true,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // 이미지 최적화 설정
  images: {
    // 최신 이미지 포맷 지원
    formats: ['image/avif', 'image/webp'],

    // 반응형 이미지 크기
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],

    // 외부 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google 프로필 이미지
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],

    // 이미지 캐시 TTL (30일)
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withPWA(nextConfig);
