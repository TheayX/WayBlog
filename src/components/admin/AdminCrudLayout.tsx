'use client';

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

interface AdminResourceListStateProps {
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}

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
        className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? '处理中...' : editing ? '更新' : '创建'}
      </button>
      {editing && (
        <button
          onClick={onCancel}
          className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          取消
        </button>
      )}
    </div>
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
