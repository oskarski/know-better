import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowBetter | Gra imprezowa",
  description: "Towarzyska gra odkrywania faktów o solenizancie.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
