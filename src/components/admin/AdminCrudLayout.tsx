'use client';

import { ChevronUp, Check, FilePlus2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

interface AdminFormPanelProps {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

interface AdminFormActionsProps {
  editing: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

interface AdminComposerActionsProps {
  open: boolean;
  saving: boolean;
  itemLabel: string;
  onOpen: () => void;
  onSubmit: () => void;
  onCollapse: () => void;
}

interface AdminResourceListStateProps {
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}

/**
 * 管理端通用操作样式。
 *
 * 后台多个页面会复用“主按钮 / 行内编辑 / 行内删除”三类操作；
 * 统一收口到这里，避免同一交互在不同页面逐渐长出细碎差异。
 */
export const adminPrimaryActionClassName =
  'inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground';

/**
 * 管理端主要提交按钮样式。
 *
 * 表单保存、确认应用这类主操作大多使用更宽的横向留白，
 * 单独拆出来，避免和头部紧凑型入口按钮混用。
 */
export const adminPrimarySubmitClassName =
  'inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground';

/**
 * 管理端次级描边按钮样式。
 *
 * 返回、取消、稍后处理这类动作都保持同一套边框和文字反馈，
 * 让主次操作关系在后台各个表单中稳定一致。
 */
export const adminSecondaryActionClassName =
  'inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground';

/**
 * 管理端列表常规操作按钮样式。
 *
 * 编辑、查看这类次级文字操作都沿用同一组字重和 hover 反馈，
 * 让资源列表的交互层级保持一致。
 */
export const adminInlineActionClassName =
  'inline-flex items-center gap-1 text-sm text-primary hover:underline';

/**
 * 管理端危险操作按钮样式。
 *
 * 删除类动作统一用这套强调色和交互反馈，避免不同页面出现不同的风险语义。
 */
export const adminInlineDangerActionClassName =
  'inline-flex items-center gap-1 text-sm text-destructive hover:underline';

/**
 * 管理端小号描边按钮样式。
 *
 * 用于区块内的局部应用动作，尺寸比常规底部操作更轻，避免抢占主操作层级。
 */
export const adminCompactSecondaryActionClassName =
  'inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground';

/**
 * 后台 CRUD 表单外壳。
 *
 * 分类、标签和友链管理页都使用同一套“标题 + 输入区 + 操作区”结构；
 * 抽成小组件后，各页面仍保留自己的字段和业务校验，不引入过重的配置式 CRUD。
 */
export function AdminFormPanel({
  title,
  description,
  headerAction,
  children,
}: AdminFormPanelProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm leading-7 text-muted-foreground">{description}</p>}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * 后台 CRUD 表单操作按钮。
 *
 * 保存按钮文案由编辑态决定，取消按钮只在编辑态展示，保持三个资源管理页交互一致。
 */
export function AdminFormActions({ editing, saving, onSave, onCancel }: AdminFormActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        onClick={onSave}
        disabled={saving}
        className={`${adminPrimarySubmitClassName} hover:opacity-90 disabled:opacity-50`}
      >
        {saving ? '处理中...' : editing ? '更新' : '创建'}
      </button>
      {editing && (
        <button onClick={onCancel} className={adminSecondaryActionClassName}>
          取消
        </button>
      )}
    </div>
  );
}

/**
 * 后台新增表单头部操作区。
 *
 * 闭合时展示“新建”入口，展开后切换为更像提交动作的主按钮，
 * 避免把同一个带加号的按钮反复复用到打开态里，降低视觉和语义上的混淆。
 */
export function AdminComposerActions({
  open,
  saving,
  itemLabel,
  onOpen,
  onSubmit,
  onCollapse,
}: AdminComposerActionsProps) {
  return open ? (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className={`${adminPrimaryActionClassName} disabled:opacity-50`}
      >
        <Check className="h-4 w-4" />
        {saving ? '提交中...' : `提交${itemLabel}`}
      </button>
      <button
        type="button"
        onClick={onCollapse}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
      >
        <ChevronUp className="h-4 w-4" />
        收起表单
      </button>
    </div>
  ) : (
    <button type="button" onClick={onOpen} className={adminPrimaryActionClassName}>
      <FilePlus2 className="h-4 w-4" />
      新建{itemLabel}
    </button>
  );
}

/**
 * 后台资源列表状态外壳。
 *
 * 统一加载中和空列表展示，具体列表形态仍由调用页面决定。
 */
export function AdminResourceListState({
  loading,
  empty,
  emptyText,
  children,
}: AdminResourceListStateProps) {
  if (loading) {
    return <EmptyState title="内容加载中" description="正在拉取当前资源列表，请稍候。" />;
  }

  if (empty) {
    return (
      <EmptyState title={emptyText} description="当前还没有可展示的数据，可以先创建第一条内容。" />
    );
  }

  return <>{children}</>;
}
