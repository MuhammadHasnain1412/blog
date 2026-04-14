import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  async redirects() {
    return [
      {
        source: "/sitemap-0.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // AWS S3 — cover image uploads (matches any bucket/region)
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },
};

export default nextConfig;
