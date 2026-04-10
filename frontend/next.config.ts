const nextConfig = {
  async rewrites() {
    const target = process.env.GATEWAY_API_TARGET;

    if (!target) {
      throw new Error("GATEWAY_API_TARGET is missing (set it in .env.local)");
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${target}/auth/:path*`,
      },
      {
        source: "/api/profile/:path*",
        destination: `${target}/profile/:path*`,
      },
      {
        source: "/api/gateway/:path*",
        destination: `${target}/gateway/:path*`,
      },
    ];
  },
};

export default nextConfig;
