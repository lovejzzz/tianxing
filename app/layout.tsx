import type { Metadata, Viewport } from "next";
import "./globals.css";

const phoneIntroBootstrap = `
try {
  var desktopIntro = window.matchMedia('(min-width: 561px) and (prefers-reduced-motion: no-preference)').matches;
  if (!desktopIntro) {
    delete document.documentElement.dataset.phoneIntro;
    document.documentElement.classList.remove('phone-intro-pending');
  }
} catch (_) {}
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://tian.fun/"),
  title: {
    default: "Tian Xing",
    template: "%s — Tian Xing",
  },
  description:
    "Welcome to Tian Xing’s iPhone.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Tian Xing",
    description:
      "Welcome to Tian Xing’s iPhone.",
    type: "website",
    images: [{ url: "https://tian.fun/og.png", width: 1729, height: 910, alt: "Tian Xing’s iPhone" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tian Xing",
    description: "Welcome to Tian Xing’s iPhone.",
    images: ["https://tian.fun/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tian",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05070a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="phone-intro-pending"
      data-phone-intro="pending"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/media/cases/red-fuji-case.jpg"
        />
        <style dangerouslySetInnerHTML={{ __html: "html.phone-intro-pending{background:#020305!important}html.phone-intro-pending body{visibility:hidden!important}" }} />
        <noscript>
          <style>{"html.phone-intro-pending body{visibility:visible!important}"}</style>
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: phoneIntroBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
