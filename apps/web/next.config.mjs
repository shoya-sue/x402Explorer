/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@x402/shared"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
