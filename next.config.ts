import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mysql2', 'pino', 'pino-pretty'],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
