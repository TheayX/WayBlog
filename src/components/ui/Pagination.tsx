import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * 通用分页组件。
 *
 * basePath 可能已经包含查询参数，因此通过 separator 兼容两种 URL 形态，
 * 避免在归档、标签等前台页面重复处理分页链接拼接细节。
 * 当总页数小于等于 1 时直接不渲染，避免无意义分页控件干扰阅读流。
 * 组件只负责上一页/下一页与当前页展示，不内置复杂页码矩阵，目的是保持前台页面分页交互轻量一致。
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const separator = basePath.includes('?') ? '&' : '?';

  return (
    <div className="flex items-center justify-center gap-3 pt-8">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          上一页
        </Link>
      ) : (
        <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground opacity-50">
          <ArrowLeft className="h-4 w-4" />
          上一页
        </span>
      )}

      <span className="inline-flex h-11 items-center rounded-full border border-border bg-muted/70 px-4 text-sm text-muted-foreground">
        第 {currentPage} / {totalPages} 页
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          下一页
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground opacity-50">
          下一页
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
