/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/horarios/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/miamigayyo',
        destination: 'https://programademano.com.ar/miamigayyo',
        permanent: true,
      },
      {
        source: '/lacenadelostontos',
        destination: 'https://programademano.com.ar/lacenadelostontos',
        permanent: true,
      },
      {
        source: '/alejandra',
        destination: 'https://programademano.com.ar/alejandra',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sobre-nosotros',
        destination: '/nosotros',
        permanent: true,
      },
      {
        source: '/admin/sobre-nosotros',
        destination: '/admin/nosotros',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
