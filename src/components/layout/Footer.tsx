import { ArrowUpRight, Rss } from 'lucide-react';
import Link from 'next/link';
import { SITE_PROFILE } from '@/config/site';
import { SITE_BRAND } from './site-config';

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
              <p className="eyebrow">{SITE_BRAND.fullName}</p>
              <div className="space-y-2">
                <p className="editorial-title text-3xl font-semibold text-foreground">
                  {SITE_PROFILE.footerHeadline}
                </p>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {SITE_PROFILE.footerDescription}
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
                  href={SITE_PROFILE.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 hover:border-border-strong hover:text-foreground"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {SITE_PROFILE.githubLabel}
                </a>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="font-medium text-foreground">{SITE_BRAND.shortName}</p>
                <p>© {year} All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
