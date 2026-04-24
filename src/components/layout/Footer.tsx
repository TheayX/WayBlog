import { ArrowUpRight, Rss } from 'lucide-react';
import Link from 'next/link';

/**
 * 站点页脚。
 *
 * 负责集中展示版权信息、RSS 与外部仓库入口，
 * 让前台页面底部保留稳定的站点身份和分发能力。
 * 这里的链接都属于全站级公共出口，因此适合保持轻量、稳定，不与具体页面业务耦合。
 * `year` 在渲染时动态计算，避免为这种全局静态信息额外维护配置项。
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-6 pt-10 sm:px-6">
      <div className="page-shell">
        <div className="page-frame px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">WayBlog</p>
              <div className="space-y-2">
                <p className="editorial-title text-3xl font-semibold text-foreground">
                  写代码，写文章，也写清楚自己在想什么。
                </p>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                  这是一个偏内容优先的技术博客，记录开发实践、工程思考和持续整理后的经验。
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/feed.xml"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 hover:border-border-strong hover:text-foreground"
                >
                  <Rss className="h-4 w-4" />
                  RSS
                </Link>
                <a
                  href="https://github.com/wayblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 hover:border-border-strong hover:text-foreground"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  GitHub
                </a>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="font-medium text-foreground">Way.</p>
                <p>© {year} All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
