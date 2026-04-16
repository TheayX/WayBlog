'use client';

import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type { AiField, AiOptimizeResult, AiSuggestionTag } from '@/lib/ai/types';

/**
 * AI 建议侧边抽屉。
 *
 * 负责把全文优化结果拆成可逐项审阅、逐项应用的界面结构，
 * 让管理后台在“整包接受”和“人工挑选”之间保留控制权。
 * `matchedCategoryId` 用来提示分类建议是否已经命中现有分类，避免编辑器把“推荐值”和“可直接应用值”混为一谈。
 */
interface AiSuggestionDrawerProps {
  open: boolean;
  result: AiOptimizeResult | null;
  matchedCategoryId: string;
  onClose: () => void;
  onApplyField: (field: AiField) => void;
  onApplyAll: () => void;
}

export function AiSuggestionDrawer({
  open,
  result,
  matchedCategoryId,
  onClose,
  onApplyField,
  onApplyAll,
}: AiSuggestionDrawerProps) {
  if (!open || !result) return null;

  const existingTags = result.tagSuggestions.filter((tag) => !tag.isNew);
  const newTags = result.tagSuggestions.filter((tag) => tag.isNew);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">AI 优化建议</h2>
            <p className="text-sm text-muted-foreground">先查看建议内容，再决定是否应用到表单。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {result.warnings.length > 0 && (
            <section className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 text-sm font-medium text-amber-700">提醒</h3>
              <ul className="space-y-1 text-sm text-amber-700">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          <SuggestionSection title="标题建议" actionLabel="应用标题" onApply={() => onApplyField('title')}>
            <p className="text-sm leading-6">{result.title}</p>
          </SuggestionSection>

          <SuggestionSection title="Slug 建议" actionLabel="应用 Slug" onApply={() => onApplyField('slug')}>
            <p className="font-mono text-sm leading-6">{result.slug}</p>
          </SuggestionSection>

          <SuggestionSection title="摘要建议" actionLabel="应用摘要" onApply={() => onApplyField('excerpt')}>
            <p className="text-sm leading-6">{result.excerpt || 'AI 未生成摘要建议'}</p>
            {result.excerpt && (
              <p className="text-xs text-muted-foreground">当前摘要长度：{result.excerpt.length} 字</p>
            )}
          </SuggestionSection>

          <SuggestionSection title="正文建议" actionLabel="应用正文" onApply={() => onApplyField('content')}>
            <div className="rounded-md border border-border p-4">
              <MarkdownRenderer content={result.content} />
            </div>
          </SuggestionSection>

          <SuggestionSection title="分类建议" actionLabel="应用分类" onApply={() => onApplyField('category')}>
            {result.categorySuggestion ? (
              <div className="space-y-2 text-sm leading-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                    {result.categorySuggestion.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {matchedCategoryId ? '已匹配到现有分类' : '未匹配到现有分类'}
                  </span>
                </div>
                {result.categorySuggestion.reason && (
                  <p className="text-muted-foreground">{result.categorySuggestion.reason}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">AI 暂未给出分类建议</p>
            )}
          </SuggestionSection>

          <SuggestionSection title="标签建议" actionLabel="应用标签" onApply={() => onApplyField('tags')}>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">推荐现有标签</p>
                <div className="flex flex-wrap gap-2">
                  {existingTags.length > 0 ? (
                    existingTags.map((tag) => (
                      <TagSuggestionChip key={`${tag.id || tag.name}-existing`} tag={tag} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">AI 暂未匹配到现有标签</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">建议新增标签</p>
                <div className="flex flex-wrap gap-2">
                  {newTags.length > 0 ? (
                    newTags.map((tag) => <TagSuggestionChip key={`${tag.name}-new`} tag={tag} />)
                  ) : (
                    <p className="text-sm text-muted-foreground">当前没有新增标签建议</p>
                  )}
                </div>
              </div>
            </div>
          </SuggestionSection>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onApplyAll}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            全部应用
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestionSection({
  title,
  actionLabel,
  onApply,
  children,
}: {
  title: string;
  actionLabel: string;
  onApply: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">{title}</h3>
        <button
          type="button"
          onClick={onApply}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function TagSuggestionChip({ tag }: { tag: AiSuggestionTag }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        tag.isNew
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          : 'border-primary/30 bg-primary/10 text-primary'
      }`}
    >
      <div className="font-medium">
        {tag.name}
        {tag.isNew ? '（建议新增）' : ''}
      </div>
      {tag.reason && <div className="mt-1 text-[11px] opacity-80">{tag.reason}</div>}
    </div>
  );
}
