import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaceFrame V11",
  description: "Governed synthetic runtime infrastructure."
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
