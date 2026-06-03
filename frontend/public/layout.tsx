import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. Las propiedades de visualización ahora van en este objeto separado
export const viewport: Viewport = {
  themeColor: "#800020",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. Metadata limpia solo con la referencia al manifest
export const metadata: Metadata = {
  title: "Sistema de Control Escolar",
  description: "Panel de Gestión Administrativa",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Control Escolar",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Forzamos el link del manifest por si el objeto metadata tiene lag */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}