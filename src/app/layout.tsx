import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteName = process.env.SITE_NAME || "Way";
const siteDescription = process.env.SITE_DESCRIPTION || "A Journey of Code and Thought";
const siteUrl = process.env.SITE_URL || "http://localhost:3610";

/**
 * 应用根布局与全站默认元数据。
 *
 * 这里同时服务公开页和管理后台，负责统一注入字体、主题能力、全局提示组件，
 * 并定义站点级 metadata，供前台页面与元数据路由复用。
 */
export const metadata: Metadata = {
  title: {
    default: `${siteName} — ${siteDescription}`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName,
    title: {
      default: `${siteName} — ${siteDescription}`,
      template: `%s — ${siteName}`,
    },
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: `${siteName} — ${siteDescription}`,
      template: `%s — ${siteName}`,
    },
    description: siteDescription,
  },
  alternates: {
    types: {
      // 将 RSS 输出注册为全站可发现的订阅入口。
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
