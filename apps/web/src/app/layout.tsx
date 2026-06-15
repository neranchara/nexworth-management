import type { Metadata } from "next";
import { Prompt } from "next/font/google";
// @ts-ignore
import "./globals.css";
import PrewarmDB from "../components/PrewarmDB";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexworth - Professional Financial Management",
  description: "Next-generation wealth tracking dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = (cookieStore.get('NEXT_THEME')?.value ?? 'dark') as 'dark' | 'light';

  return (
    <html lang={locale} className={theme}>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nexworth-management.onrender.com" />
        <link rel="preconnect" href="https://nexworth-management.onrender.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${prompt.variable} ${prompt.className} font-sans antialiased bg-midnight text-slate-100`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PrewarmDB />
          {children}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
