import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  optimizeFonts: true,
  images: {
    domains: ['shadcnblocks.com'],
  },
};

export default nextConfig;
