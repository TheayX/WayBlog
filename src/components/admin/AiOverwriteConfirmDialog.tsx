'use client';

import {
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';

export interface AiOverwritePreviewItem {
  key: 'title' | 'slug' | 'identity' | 'content';
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
  onConfirm,
  onSkipOverwrite,
  onClose,
}: AiOverwriteConfirmDialogProps) {
  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(22_21_20/0.32)] px-4 backdrop-blur-[6px]">
      <div className="page-frame w-full max-w-3xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background-elevated)_92%,white_8%),color-mix(in_srgb,var(--background-elevated)_98%,transparent))] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">AI Confirm</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">确认覆盖现有内容</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              以下字段已有内容。继续后会用 AI 建议覆盖当前值；如果选择跳过，则这些覆盖项不会应用，其他安全项仍会继续。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            关闭
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <section key={item.key} className="page-frame px-4 py-4">
              <h3 className="text-base font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.currentLabel}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {item.currentValue}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--primary)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_6%,var(--background))] p-4">
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
            跳过这些覆盖项
          </button>
          <button type="button" onClick={onConfirm} className={adminPrimarySubmitClassName}>
            继续应用 AI 建议
          </button>
        </div>
      </div>
    </div>
  );
}
