/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = {
  ...nextConfig,
  env: {
    NEXT_PUBLIC_RPC: process.env.NEXT_PUBLIC_RPC,
  }
};