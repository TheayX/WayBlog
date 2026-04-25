'use client';

import {
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';

export interface AiOverwritePreviewItem {
  key: 'title' | 'slug' | 'identity' | 'content' | 'excerpt';
  title: string;
  description: string;
  currentLabel: string;
  currentValue: string;
  nextLabel: string;
  nextValue: string;
}

interface AiOverwriteConfirmDialogProps {
  open: boolean;
  items: AiOverwritePreviewItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  skipLabel?: string;
  onConfirm: () => void;
  onSkipOverwrite: () => void;
  onClose: () => void;
}

/**
 * AI 覆盖确认弹窗。
 *
 * 用统一样式承接标题、Slug、正文这类高风险覆盖确认，
 * 避免继续混用浏览器原生 confirm，破坏后台交互一致性。
 */
export function AiOverwriteConfirmDialog({
  open,
  items,
  eyebrow = 'AI Confirm',
  title = '确认采纳 AI 建议',
  description = '请先确认这次 AI 建议的内容。继续后会把右侧建议写入当前编辑区；本次操作不会自动保存文章。',
  confirmLabel = '采纳 AI 建议',
  skipLabel = '暂不采纳',
  onConfirm,
  onSkipOverwrite,
  onClose,
}: AiOverwriteConfirmDialogProps) {
  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(22_21_20/0.32)] px-4 backdrop-blur-[6px]">
      <div className="page-frame w-full max-w-4xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background-elevated)_92%,white_8%),color-mix(in_srgb,var(--background-elevated)_98%,transparent))] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
          >
            关闭
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <section
              key={item.key}
              className="page-frame bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_88%,white_12%),color-mix(in_srgb,var(--background)_98%,transparent))] px-4 py-4"
            >
              <h3 className="text-base font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-border bg-background p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.currentLabel}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {item.currentValue}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--primary)_24%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,var(--background)),color-mix(in_srgb,var(--primary)_4%,var(--background-elevated)))] p-4 shadow-[0_16px_40px_-28px_rgba(37,99,235,0.45)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">{item.nextLabel}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {item.nextValue}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onSkipOverwrite} className={adminSecondaryActionClassName}>
            {skipLabel}
          </button>
          <button type="button" onClick={onConfirm} className={adminPrimarySubmitClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
