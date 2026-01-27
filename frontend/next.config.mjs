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
};

export default nextConfig;
