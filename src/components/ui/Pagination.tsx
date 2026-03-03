import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const separator = basePath.includes('?') ? '&' : '?';

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          上一页
        </Link>
      ) : (
        <span className="rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
          上一页
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          下一页
        </Link>
      ) : (
        <span className="rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
          下一页
        </span>
      )}
    </div>
  );
}
