import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoraXS Core App",
  description: "Core authentication shell for app.nexoraxs.com",
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
