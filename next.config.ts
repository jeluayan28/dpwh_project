import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // docusign-esign uses AMD modules; keep it as a server-side Node.js external
  serverExternalPackages: ["docusign-esign"],
  // Silence the "webpack config but no turbopack config" warning
  turbopack: {},
};

export default nextConfig;
