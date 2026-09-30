import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Forever",
  description: "Unki yaadein, unka ehsaas — hamesha aapke saath.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
