/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@home-assets/tokens', '@home-assets/validation'],
  images: {
    domains: ['images.unsplash.com'],
  },
};

module.exports = nextConfig;
