import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaceFrame",
  description: "Working continuity-governed synthetic media prototype."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
