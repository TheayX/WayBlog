import Link from 'next/link';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * 全局 404 页面。
 *
 * 当公开页或管理后台命中未匹配路由时，都会回落到这里；
 * 页面仅负责兜底提示与返回前台首页，不参与任何数据读取。
 */
export const metadata: Metadata = {
  title: '页面不存在',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center">
      <EmptyState
        title="页面不存在"
        description="你访问的页面可能已被移除、名称已更改或暂时不可用。"
        action={
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            返回首页
          </Link>
        }
      />
    </div>
  );
}
