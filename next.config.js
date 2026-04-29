/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
    ]
  },
}

module.exports = nextConfig
