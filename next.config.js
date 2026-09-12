/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 15, so remove it
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  trailingSlash: false,
}

module.exports = nextConfig