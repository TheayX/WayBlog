'use client';

interface PostEditorPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * 文章编辑页通用外层工作台。
 *
 * 新建与编辑场景复用同一套头部结构、流程提示和 AI 工具栏停靠位，
 * 避免两个页面只共享表单、不共享页面壳子，导致布局和交互入口逐步漂移。
 */
export function PostEditorPageShell({
  title,
  description,
  children,
}: PostEditorPageShellProps) {
  return (
    <div className="space-y-6">
      <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
        <div className="rounded-[1.75rem] border border-border bg-background px-6 py-6">
          <p className="eyebrow">Editor</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex h-full flex-col">
          <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-3 text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Flow</p>
            <p className="mt-2.5 text-sm text-primary-foreground/80">建议流程</p>
            <p className="mt-1.5 text-sm leading-6 text-primary-foreground/80">
              先写标题与结构，再补正文和摘要，最后处理分类、标签与发布状态。
            </p>
          </div>
          <div aria-hidden="true" className="min-h-0 flex-1" />
          <div id="post-ai-toolbar-slot" className="flex justify-end pt-3" />
        </div>
      </section>

      {children}
    </div>
  );
}
