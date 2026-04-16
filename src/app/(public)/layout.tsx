import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * 公开页布局。
 *
 * 该布局只包裹前台页面，统一提供站点头部、页脚与内容宽度控制；
 * 管理后台使用独立布局，避免前后台导航与交互混用。
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 xl:max-w-5xl">{children}</main>
      <Footer />
    </div>
  );
}

