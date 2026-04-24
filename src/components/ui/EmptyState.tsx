import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

/**
 * 通用空态卡片。
 *
 * 统一空数据场景下的结构和留白，避免每个页面各写一套空态容器。
 */
export function EmptyState({ title = '暂无内容', description, action }: EmptyStateProps) {
  return (
    <div className="page-frame px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
