import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovejzzz.github.io/tianxing/"),
  title: {
    default: "Tian Xing — Selected Work",
    template: "%s — Tian Xing",
  },
  description:
    "Selected software, games, film, music tools, and experiments by Tian Xing.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Tian Xing — Selected Work",
    description:
      "Nine projects across software, games, cinema, music tools, and experiments.",
    type: "website",
    images: [{ url: "https://lovejzzz.github.io/tianxing/og.png", width: 1729, height: 910, alt: "Tian Xing — Selected Work" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tian Xing — Selected Work",
    description: "Nine projects across code, cinema, games, and sound.",
    images: ["https://lovejzzz.github.io/tianxing/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
