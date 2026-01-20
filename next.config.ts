import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sabuwzgrrrxbfarihvc.supabase.co",
      },
    ],
  },
};

export default nextConfig;