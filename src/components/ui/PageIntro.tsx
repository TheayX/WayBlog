import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}

/**
 * 页面头图区块。
 *
 * 前后台多个页面都采用同一套“eyebrow + 标题 + 描述 + 右侧补充信息”结构，
 * 抽出来后可以减少重复类名并稳定整体视觉节奏。
 */
export function PageIntro({ eyebrow, title, description, aside }: PageIntroProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
      <div className="rounded-[1.75rem] border border-border bg-background px-6 py-6">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {aside ? aside : <div className="hidden lg:block" />}
    </section>
  );
}
