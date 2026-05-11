import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaceFrame V12",
  description: "Supabase-backed governed synthetic runtime."
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
