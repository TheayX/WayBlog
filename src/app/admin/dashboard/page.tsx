'use client';

import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">无法加载统计数据</p>
      </div>
    );
  }

  const cards = [
    { label: '文章总数', value: stats.totalPosts, color: 'text-primary' },
    { label: '已发布', value: stats.totalPublished, color: 'text-green-600' },
    { label: '草稿', value: stats.totalDrafts, color: 'text-yellow-600' },
    { label: '分类', value: stats.totalCategories, color: 'text-purple-600' },
    { label: '标签', value: stats.totalTags, color: 'text-accent' },
    { label: '总浏览量', value: stats.totalViews, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border p-4 text-center"
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 最近 30 天 PV/UV 趋势 */}
      {stats.recentViews.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">最近 30 天流量趋势</h2>
          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" /> PV
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" /> UV
              </span>
            </div>
            <div className="flex items-end gap-1 overflow-x-auto" style={{ height: 160 }}>
              {stats.recentViews.map((day) => {
                const maxPv = Math.max(...stats.recentViews.map((d) => d.pv), 1);
                const pvHeight = Math.max((day.pv / maxPv) * 140, 2);
                const uvHeight = Math.max((day.uv / maxPv) * 140, 2);
                return (
                  <div
                    key={day.date}
                    className="group relative flex flex-1 min-w-2 items-end gap-px"
                    title={`${day.date}\nPV: ${day.pv}  UV: ${day.uv}`}
                  >
                    <div
                      className="flex-1 rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{ height: pvHeight }}
                    />
                    <div
                      className="flex-1 rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
                      style={{ height: uvHeight }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{stats.recentViews[0]?.date.slice(5)}</span>
              <span>{stats.recentViews[stats.recentViews.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 文章 */}
      {stats.topPosts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">热门文章 Top 5</h2>
          <div className="rounded-lg border border-border">
            {stats.topPosts.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm">{post.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">{post.viewCount} 次浏览</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

