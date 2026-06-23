import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages directly — no pre-build step.
  transpilePackages: ["@shift9/ui", "@shift9/motion", "@shift9/data"],
};

export default nextConfig;
