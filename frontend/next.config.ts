import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["usrv-01"],
  images: {
    qualities: [75, 80],
  },
};

export default nextConfig;
