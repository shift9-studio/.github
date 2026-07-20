import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages directly — no pre-build step.
  transpilePackages: ["@shift9/ui", "@shift9/motion"],
  // The Uncut Soundstage (apps/studio) is staged into public/studio at build
  // time; route the bare path to its entry so shift9.dev/studio serves it.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/studio", destination: "/studio/index.html" },
        { source: "/studio/", destination: "/studio/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
