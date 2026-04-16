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
    <footer className="mt-16 border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <p className="font-medium text-foreground">Way. <span className="text-muted-foreground font-normal">A Journey of Code and Thought</span></p>
          <p>© {year} All rights reserved.</p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/feed.xml" className="flex items-center gap-1 hover:text-primary transition-colors">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 11a9 9 0 019 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 4a16 16 0 0116 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="19" r="1"/>
            </svg>
            RSS
          </Link>
          <a
            href="https://github.com/wayblog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

