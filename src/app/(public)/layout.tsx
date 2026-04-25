import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getPublicNavigationPages } from '@/lib/pages/queries';

export const dynamic = 'force-dynamic';

/**
 * 公开页布局。
 *
 * 该布局只包裹前台页面，统一提供站点头部、页脚与内容宽度控制；
 * 管理后台使用独立布局，避免前后台导航与交互混用。
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const pages = await getPublicNavigationPages();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header pages={pages} />
      <main className="page-shell flex-1 pb-12 pt-6 md:pt-8">
        <div className="relative mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
