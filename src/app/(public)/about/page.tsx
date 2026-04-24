import type { Metadata } from 'next';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { getPublicPageBySlug } from '@/lib/pages/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '关于',
  description: '关于站点与作者。',
};

/**
 * 前台关于页。
 *
 * 通过 slug 为 `about` 的单页内容承载站点介绍；
 * 如果后台尚未创建该页面，则展示创建提示而不是 404。
 */
export default async function AboutPage() {
  const page = await getPublicPageBySlug('about');

  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">About</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
          {page?.title || '关于'}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          这里用于承载站点定位、写作方向与作者说明，风格上会比普通正文页更像一个正式的站点介绍入口。
        </p>
      </header>

      {page?.content ? (
        <div className="page-frame p-6 sm:p-8 lg:p-10">
          <MarkdownRenderer content={page.content} />
        </div>
      ) : (
        <div className="page-frame px-6 py-12 text-center">
          <p className="text-muted-foreground">
            这里还没有内容，去后台创建一个 slug 为 <code>about</code> 的页面即可。
          </p>
        </div>
      )}
    </div>
  );
}
