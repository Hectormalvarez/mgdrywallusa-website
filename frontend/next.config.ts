import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["usrv-01"],
  images: {
    qualities: [75, 80],
  },
};

export default nextConfig;
