import type { Metadata } from "next";
import { Prompt } from "next/font/google";
// @ts-ignore
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexworth - Professional Financial Management",
  description: "Next-generation wealth tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${prompt.variable} ${prompt.className} font-sans antialiased bg-midnight text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
