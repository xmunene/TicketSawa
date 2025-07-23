import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns:[
      {
        hostname: "hushed-zebra-896.convex.cloud",
        protocol: "https",
      }
    ]
  }
};

export default nextConfig;
