/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // Bilder werden lokal via /api/uploads/ serviert — keine externen Domains nötig
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'better-sqlite3'],
  },
}

export default nextConfig
