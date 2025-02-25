import { env } from '@/env';
import { config, withAnalyzer } from '@repo/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = config;

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
