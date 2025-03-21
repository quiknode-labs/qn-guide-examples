import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply this on the server-side bundle
    if (isServer) {
      // Mark these modules as external so webpack doesn't try to bundle them
      config.externals.push(
        "@trufflesuite/uws-js-unofficial",
        "ganache",
        "@chainlink/functions-toolkit"
      );
    }

    return config;
  },
};

export default nextConfig;
