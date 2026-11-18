import type { Metadata } from "next";
import "./globals.css";
import "./expressive-motion.css";
import "./mobile-story.css";
import "./futuristic-theme.css";
import AuthCallback from "./auth-callback";
import SmoothScroll from "./smooth-scroll";

export const metadata: Metadata = {
  title: "Esme-Commerce",
  description: "A seller workspace for research, sourcing and commerce operations.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><SmoothScroll /><AuthCallback />{children}</body>
    </html>
  );
}
