/** @type {import('next').NextConfig} */
const nextConfig = {
  // API Routes에서 외부 API 호출 허용
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
