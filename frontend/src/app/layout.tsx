import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MG Drywall USA",
  description: "MG Drywall USA website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
