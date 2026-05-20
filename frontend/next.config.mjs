/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better debugging
  reactStrictMode: true,
  
  // Image domains for external images (logos, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.parqet.com',
      },
    ],
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable experimental features if needed
  experimental: {
    // Server actions for form handling
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Backwards-compatible redirects after the research-first IA restructure.
  // /positions, /orders, /activity moved under /portfolio. Permanent so
  // search engines + bookmarks update; the bot / Discord links continue
  // to work without per-link edits.
  async redirects() {
    return [
      { source: '/positions', destination: '/portfolio/positions', permanent: true },
      { source: '/positions/:path*', destination: '/portfolio/positions/:path*', permanent: true },
      { source: '/orders', destination: '/portfolio/orders', permanent: true },
      { source: '/orders/:path*', destination: '/portfolio/orders/:path*', permanent: true },
      { source: '/activity', destination: '/portfolio/activity', permanent: true },
      { source: '/activity/:path*', destination: '/portfolio/activity/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
