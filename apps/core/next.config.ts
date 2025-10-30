import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@core-auth',
    '@core-utils',
    '@core-audit',
    '@core-analytics',
    '@core-billing',
  ],
};

export default nextConfig;

