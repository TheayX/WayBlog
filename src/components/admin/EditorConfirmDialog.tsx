'use client';

import {
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';

interface EditorConfirmDialogProps {
  open: boolean;
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 编辑态确认弹窗。
 *
 * 统一承接“未保存但继续操作”的确认场景，
 * 避免 AI 使用确认、后台页跳转确认继续散落成多套临时弹层。
 */
export function EditorConfirmDialog({
  open,
  eyebrow,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: EditorConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(22_21_20/0.32)] px-4 backdrop-blur-[6px]">
      <div className="page-frame w-full max-w-3xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background-elevated)_92%,white_8%),color-mix(in_srgb,var(--background-elevated)_98%,transparent))] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
          >
            关闭
          </button>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className={adminSecondaryActionClassName}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={adminPrimarySubmitClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
