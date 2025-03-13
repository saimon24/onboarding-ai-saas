/** @type {import('next').NextConfig} */
const nextConfig = {
  // Change from static export to server rendering
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Remove the exportPathMap since we're not using static export anymore
};

module.exports = nextConfig;
