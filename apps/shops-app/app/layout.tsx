import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoraXS Shops App",
  description: "Shops placeholder shell for shops.nexoraxs.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
