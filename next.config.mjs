/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/euindico',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
