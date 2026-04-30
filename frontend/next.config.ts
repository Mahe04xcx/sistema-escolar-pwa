import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  // Esta línea ayuda a silenciar advertencias de Turbopack si persisten
  transpilePackages: ["@ducanh2912/next-pwa"], 
};

export default withPWA(nextConfig);