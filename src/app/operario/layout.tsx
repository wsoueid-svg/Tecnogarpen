import type { Metadata, Viewport } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operario",
  applicationName: "Tecno Garpen Operario",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Operario",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e4d6b",
  width: "device-width",
  initialScale: 1,
};

export default function OperarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
