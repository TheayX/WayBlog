import { PostForm } from '@/components/admin/PostForm';

/**
 * 管理后台新建文章页。
 *
 * 只负责挂载空白表单，让编辑逻辑统一复用 PostForm，
 * 避免新建与编辑场景各自维护一套字段状态。
 */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
        <div className="rounded-[1.75rem] border border-border bg-background px-6 py-6">
          <p className="eyebrow">Editor</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">新建文章</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            编辑页将标题、正文、摘要、封面、分类与 AI
            辅助统一收进一套创作工作台，不再是简单字段堆叠。
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Flow</p>
          <p className="mt-4 text-sm text-primary-foreground/80">建议流程</p>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/80">
            先写标题与结构，再补正文和摘要，最后处理分类、标签与发布状态。
          </p>
        </div>
      </section>

      <PostForm />
    </div>
  );
}
