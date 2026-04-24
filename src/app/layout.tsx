import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { getSiteConfig } from '@/lib/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
});

const siteConfig = getSiteConfig();

/**
 * 应用根布局与全站默认元数据。
 *
 * 这里同时服务公开页和管理后台，负责统一注入字体、主题能力、全局提示组件，
 * 并定义站点级 metadata，供前台页面与元数据路由复用。
 */
export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.description}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: '/brand/wayblog-mark.svg',
    shortcut: '/brand/wayblog-mark.svg',
    apple: '/brand/wayblog-mark.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: siteConfig.name,
    title: {
      default: `${siteConfig.name} — ${siteConfig.description}`,
      template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: `${siteConfig.name} — ${siteConfig.description}`,
      template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
  },
  alternates: {
    types: {
      // 将 RSS 输出注册为全站可发现的订阅入口。
      'application/rss+xml': '/feed.xml',
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
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}>
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
