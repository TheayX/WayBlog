/**
 * 前台公共 loading 态。
 *
 * 为公开页路由切换提供统一骨架，避免在服务端取数期间直接闪到空白页。
 */
export default function PublicLoading() {
  return (
    <div className="space-y-8">
      <div className="page-frame px-6 py-8 sm:px-8">
        <div className="h-3 w-24 rounded-full bg-muted/60" />
        <div className="mt-5 h-10 w-3/4 rounded-2xl bg-muted/60" />
        <div className="mt-4 h-5 w-2/3 rounded-full bg-muted/50" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="page-frame px-6 py-8">
            <div className="h-4 w-40 rounded-full bg-muted/50" />
            <div className="mt-4 h-8 w-2/3 rounded-2xl bg-muted/60" />
            <div className="mt-4 h-4 w-full rounded-full bg-muted/40" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
