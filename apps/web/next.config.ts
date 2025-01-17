import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['shadcnblocks.com'],
  },
};

export default nextConfig;
