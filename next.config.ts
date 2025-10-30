import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'adm-zip',
    'fetch-blob',
    'node-fetch'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.etsystatic.com',
        pathname: '/**',
      },
    ],
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  },
  eslint: {
    // Only run ESLint on changed files, don't fail production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail production builds on TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
