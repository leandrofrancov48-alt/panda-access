import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "pandaccess.com.ar",
          },
        ],
        destination: "https://pandaaccess.com.ar/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.pandaccess.com.ar",
          },
        ],
        destination: "https://pandaaccess.com.ar/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
