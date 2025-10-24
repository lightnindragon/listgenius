/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'adm-zip',
    'fetch-blob',
    'node-fetch'
  ],
  // Removed webpack configuration - Turbopack handles client-side fallbacks automatically
};

module.exports = nextConfig;
