import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HostelProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Aishwaraya Hostels & PG Console",
  description: "Private staff operations console for Aishwaraya Hostels & PG (8 Branches in Chennai). Secure Staff Terminal.",
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aishwaraya Hostels & PG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F243F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans selection:bg-[#F8EDD0] selection:text-[#8A6A1B]">
        <HostelProvider>{children}</HostelProvider>
      </body>
    </html>
  );
}
