import type { Metadata } from 'next';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { getPublicPageBySlug } from '@/lib/pages/queries';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
import { stripEmoji } from '@/lib/utils';

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
  const sanitizedTitle = stripEmoji(page?.title || '关于');
  const sanitizedContent = page?.content ? stripEmoji(page.content) : '';

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="About"
        title={sanitizedTitle}
        description="这里用于承载站点定位、写作方向与作者说明，风格上会比普通正文页更像一个正式的站点介绍入口。"
      />

      {sanitizedContent ? (
        <div className="page-frame p-6 sm:p-8 lg:p-10">
          <MarkdownRenderer content={sanitizedContent} />
        </div>
      ) : (
        <EmptyState description="这里还没有内容，去后台创建一个 slug 为 about 的页面即可。" />
      )}
    </div>
  );
}
