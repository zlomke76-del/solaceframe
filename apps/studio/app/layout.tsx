import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaceFrame V8",
  description: "Governance-native synthetic media creation."
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
