'use client';

import type { ReactNode } from 'react';

interface AdminFormPanelProps {
  title: string;
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
export function AdminFormPanel({ title, children }: AdminFormPanelProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </div>
  );
}

/**
 * 后台 CRUD 表单操作按钮。
 *
 * 保存按钮文案由编辑态决定，取消按钮只在编辑态展示，保持三个资源管理页交互一致。
 */
export function AdminFormActions({
  editing,
  saving,
  onSave,
  onCancel,
}: AdminFormActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {editing ? '更新' : '创建'}
      </button>
      {editing && (
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
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
    return <p className="text-muted-foreground">加载中...</p>;
  }

  if (empty) {
    return <p className="text-muted-foreground">{emptyText}</p>;
  }

  return <>{children}</>;
}
