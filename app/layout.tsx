import type { Metadata, Viewport } from "next";
import "./globals.css";

const phoneIntroBootstrap = `
try {
  var desktopIntro = window.matchMedia('(min-width: 561px) and (prefers-reduced-motion: no-preference)').matches;
  if (desktopIntro) {
    document.documentElement.dataset.phoneIntro = 'pending';
    document.documentElement.classList.add('phone-intro-pending');
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: ".phone-intro-pending .phone-product{position:relative!important;width:432px!important;height:776px!important;visibility:visible!important;border:2px solid #50565c!important;border-radius:58px!important;background:radial-gradient(circle at 28% 16%,#23272b 0,#080a0c 24%,#010203 68%,#111417 100%)!important;box-shadow:inset 0 0 0 5px #050607,0 38px 78px rgba(0,0,0,.62)!important;transform-style:preserve-3d!important;transform:translate3d(-57px,18px,-127px) rotateX(.095rad) rotateY(2.921rad) rotateZ(-.024rad) scale(.9)!important}.phone-intro-pending .phone-product>*{visibility:hidden!important}" }} />
        <script dangerouslySetInnerHTML={{ __html: phoneIntroBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
