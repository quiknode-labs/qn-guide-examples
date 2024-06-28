/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**",
        },
        {
            protocol: "http",
            hostname: "localhost",
        }
      ],
    },
  };
  
export default nextConfig;
