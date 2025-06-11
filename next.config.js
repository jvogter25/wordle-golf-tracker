/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 14 - no experimental flag needed
  // NEXT_PUBLIC_ environment variables are automatically available in the browser
  
  // Vercel optimizations
  output: 'standalone',
  
  // Ensure CSS is properly handled
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimization settings
  swcMinify: true,
  
  // Ensure all pages are statically optimized when possible
  trailingSlash: false,
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig 