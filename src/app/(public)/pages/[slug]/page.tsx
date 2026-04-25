import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
import { getPublicPageBySlug } from '@/lib/pages/queries';
import { getPublicPageHref } from '@/lib/pages/shared';
import { getSiteConfig } from '@/lib/site';
import { stripEmoji } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 前台单页元数据。
 *
 * 单页统一走 `/pages/[slug]` 路由，因此 SEO 信息也直接按 slug 读取；
 * 页面不存在时返回兜底标题，避免搜索引擎拿到空白元数据。
 */
export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);

  if (!page) {
    return { title: '页面不存在' };
  }

  const site = getSiteConfig();
  const sanitizedTitle = stripEmoji(page.title);
  const sanitizedContent = stripEmoji(page.content).slice(0, 160).trim();
  const url = `${site.url}${getPublicPageHref(slug)}`;

  return {
    title: sanitizedTitle,
    description: sanitizedContent || `${sanitizedTitle} - ${site.name}`,
    openGraph: {
      type: 'article',
      title: sanitizedTitle,
      description: sanitizedContent || undefined,
      url,
    },
    twitter: {
      card: 'summary',
      title: sanitizedTitle,
      description: sanitizedContent || undefined,
    },
  };
}

/**
 * 前台单页详情页。
 *
 * 所有单页都会自动进入前台“页面”下拉，并通过同一模板渲染；
 * 这样后台新增简历、说明或项目页时，不需要再额外补独立路由组件。
 */
export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const sanitizedTitle = stripEmoji(page.title);
  const sanitizedContent = page.content ? stripEmoji(page.content) : '';

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Page"
        title={sanitizedTitle}
        description="这里展示通过后台单页管理维护的独立内容页，适合承载关于、简历、项目说明等长期内容。"
      />

      {sanitizedContent ? (
        <div className="page-frame p-6 sm:p-8 lg:p-10">
          <MarkdownRenderer content={sanitizedContent} />
        </div>
      ) : (
        <EmptyState description="这个单页已经创建，但正文还没有内容。" />
      )}
    </div>
  );
}
