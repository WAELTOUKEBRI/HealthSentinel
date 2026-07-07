import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', 

  // --- ADD THIS BLOCK TO ROUTE INTERNAL TRAFFIC ---
  async rewrites() {
    return [
      {
        // Intercept any request to /api/...
        source: '/api/:path*',
        // Forward it seamlessly to your backend service inside EKS
        destination: 'http://healthsentinel-backend-svc:80/:path*',
      },
    ];
  },
};

export default nextConfig;
