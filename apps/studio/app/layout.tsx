import "./globals.css";

export const metadata = {
  title: "SolaceFrame V8"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
