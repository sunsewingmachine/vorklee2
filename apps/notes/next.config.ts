import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@vorklee2/core-auth',
    '@vorklee2/core-utils',
    '@vorklee2/core-audit',
    '@vorklee2/core-analytics',
    '@vorklee2/core-billing',
    '@vorklee2/core-attachments',
  ],
};

export default nextConfig;


