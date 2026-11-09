import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { themeInitScript } from "@/components/theme";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://vialform.vercel.app"),
  title: {
    default: "VIALFORM | Evidence before procurement",
    template: "%s | VIALFORM",
  },
  description:
    "Institution-facing peptide research procurement. Verified identity, analytical evidence, provenance and jurisdiction eligibility before any request for quote.",
  applicationName: "VIALFORM",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "VIALFORM | Evidence before procurement",
    description: "Jurisdiction-gated scientific procurement for verified institutions. Research use only.",
    type: "website",
    images: [{ url: "/og.png", width: 1280, height: 640 }],
  },
  keywords: [
    "peptide research",
    "research procurement",
    "analytical reference",
    "jurisdiction compliance",
    "certificate of analysis",
    "RFQ",
  ],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}