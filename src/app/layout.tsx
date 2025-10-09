import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Census name generator",
  description: "Create realistic names based on data from the US government",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="tui-bg-blue-black tui-cursor">
        {children}
    </html>
  );
}
