/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/vet',
        destination: '/admin',
      },
      {
        source: '/vet/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/receptionist',
        destination: '/admin',
      },
      {
        source: '/receptionist/:path*',
        destination: '/admin/:path*',
      },
    ]
  },
}

export default nextConfig
