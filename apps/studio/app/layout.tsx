import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaceFrame | Governed Synthetic Media",
  description:
    "Continuity-aware synthetic media infrastructure with governance, provenance, and persistent world state.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
