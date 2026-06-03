import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig = {
  output: 'export' as const,
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // Esta línea ayuda a silenciar advertencias de Turbopack si persisten
  transpilePackages: ["@ducanh2912/next-pwa"], 
};

export default withPWA(nextConfig);