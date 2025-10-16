/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'vercel.app', 'api.coingecko.com', 's3.tradingview.com'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.tradingview.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com",
              "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com",
              "img-src 'self' data: blob: https: https://s3.tradingview.com https://*.tradingview.com",
              "font-src 'self' data: https://s3.tradingview.com https://*.tradingview.com https://cdn.jsdelivr.net",
              "connect-src 'self' https://s3.tradingview.com https://*.tradingview.com wss://*.tradingview.com https://api.coingecko.com",
              "frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com https://tradingview-widget.com https://www.youtube-nocookie.com https://www.facebook.com https://*.facebook.com https://web.facebook.com https://example.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://s3.tradingview.com https://*.tradingview.com"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig
