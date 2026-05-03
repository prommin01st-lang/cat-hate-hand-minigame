import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "แมวเกลียดมือ — Cat Hates Hands",
  description: "เกมฝึกปฏิกิริยาสะท้อน แมวหลบมือ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
