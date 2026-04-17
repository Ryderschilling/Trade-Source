import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The join form accepts a 5MB logo and up to 8 photos at 10MB each.
      // Raise the Server Action transport limit so valid uploads don't fail
      // before our own file validation runs.
      bodySizeLimit: "90mb",
    },
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
