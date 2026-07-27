import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages directly — no pre-build step.
  transpilePackages: ["@shift9/ui", "@shift9/motion"],

  /* ── /work is retired ──────────────────────────────────────────────────
     Four case pages lived at /work/<slug> and were deleted: they were stubs
     wearing a case study's layout. Anything still holding one of those URLs
     — a bookmark, a link in a message, a crawler's memory — now lands on
     /soon, which says the true thing about those projects, rather than on a
     404 that says the address was never here.

     Temporary (307), not permanent. Those projects are real and some of them
     will earn a page; a 308 is cached by the browser indefinitely and would
     keep sending people to /soon long after /work/<slug> came back. The
     reversible redirect is the correct one while the outcome is open. */
  async redirects() {
    return [
      { source: "/work", destination: "/soon", permanent: false },
      { source: "/work/:path*", destination: "/soon", permanent: false },
    ];
  },
};

export default nextConfig;
