import type { Metadata } from 'next';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '关于',
  description: '关于站点与作者。',
};

export default async function AboutPage() {
  const page = await prisma.page.findUnique({
    where: { slug: 'about' },
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{page?.title || '关于'}</h1>
      </header>

      {page?.content ? (
        <MarkdownRenderer content={page.content} />
      ) : (
        <p className="text-muted-foreground">
          这里还没有内容，去后台创建一个 slug 为
          {' '}
          <code>about</code>
          {' '}
          的页面即可。
        </p>
      )}
    </div>
  );
}
