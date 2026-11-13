import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Misaki 記憶",
  description: "保存日常日文問答。"
};
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="zh-TW"><body>{children}</body></html>;
}
