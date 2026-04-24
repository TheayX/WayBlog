/**
 * 后台公共 loading 态。
 *
 * 为后台路由切换提供统一骨架，避免在布局和数据切换期间出现突兀闪烁。
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
        <div className="page-frame px-6 py-6">
          <div className="h-3 w-24 rounded-full bg-muted/60" />
          <div className="mt-5 h-8 w-1/2 rounded-2xl bg-muted/60" />
          <div className="mt-4 h-5 w-2/3 rounded-full bg-muted/40" />
        </div>
        <div className="page-frame px-6 py-6">
          <div className="h-3 w-20 rounded-full bg-muted/60" />
          <div className="mt-5 h-16 w-24 rounded-2xl bg-muted/60" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="page-frame px-5 py-5">
            <div className="h-4 w-24 rounded-full bg-muted/50" />
            <div className="mt-6 h-10 w-20 rounded-2xl bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
