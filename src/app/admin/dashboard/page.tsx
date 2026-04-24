'use client';

import { BarChart3, FileText, FolderTree, PenSquare, Tag, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';

/**
 * 管理后台仪表盘页面。
 *
 * 负责消费 `/api/stats` 的聚合结果，并把文章总量、趋势图和热门内容以卡片方式展示；
 * 页面自身不重复实现统计逻辑，只负责状态展示与可视化编排。
 */
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
    { label: '文章总数', value: stats.totalPosts, icon: FileText },
    { label: '已发布', value: stats.totalPublished, icon: TrendingUp },
    { label: '草稿', value: stats.totalDrafts, icon: PenSquare },
    { label: '分类', value: stats.totalCategories, icon: FolderTree },
    { label: '标签', value: stats.totalTags, icon: Tag },
    { label: '总浏览量', value: stats.totalViews, icon: BarChart3 },
  ];
  const maxPv = Math.max(...stats.recentViews.map((d) => d.pv), 1);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_22rem]">
        <div className="rounded-[1.75rem] border border-border bg-background px-6 py-6">
          <p className="eyebrow">Overview</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">内容运营概览</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            后台首页不再只堆数字卡片，而是优先呈现发布状态、流量趋势和热门内容，便于快速判断站点运营节奏。
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Current</p>
          <p className="mt-4 text-sm text-primary-foreground/80">累计浏览总量</p>
          <p className="editorial-title mt-2 text-5xl font-semibold">{stats.totalViews}</p>
          <p className="mt-5 text-sm leading-7 text-primary-foreground/80">
            当前仪表盘聚焦内容生产与访问表现，后续可继续加入搜索、发布与 AI 辅助相关指标。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[1.5rem] border border-border bg-background px-5 py-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="editorial-title mt-6 text-4xl font-semibold text-foreground">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      {stats.recentViews.length > 0 && (
        <section className="rounded-[1.75rem] border border-border bg-background px-5 py-5">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Traffic</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">最近 30 天流量趋势</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" /> PV
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" /> UV
              </span>
            </div>
          </div>
          <div
            className="flex items-end gap-1 overflow-x-auto rounded-[1.25rem] bg-muted/45 px-3 py-4"
            style={{ height: 220 }}
          >
            {/* 这里保留纯 CSS 柱状图，先统一视觉层；后续如引入图表库再整体替换。 */}
            <div className="flex min-w-full items-end gap-1">
              {stats.recentViews.map((day) => {
                const pvHeight = Math.max((day.pv / maxPv) * 140, 2);
                const uvHeight = Math.max((day.uv / maxPv) * 140, 2);

                return (
                  <div
                    key={day.date}
                    className="group relative flex flex-1 min-w-4 items-end gap-px"
                    title={`${day.date}\nPV: ${day.pv}  UV: ${day.uv}`}
                  >
                    <div
                      className="flex-1 rounded-t-md bg-primary/75 group-hover:bg-primary"
                      style={{ height: pvHeight }}
                    />
                    <div
                      className="flex-1 rounded-t-md bg-accent/75 group-hover:bg-accent"
                      style={{ height: uvHeight }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{stats.recentViews[0]?.date.slice(5)}</span>
            <span>{stats.recentViews[stats.recentViews.length - 1]?.date.slice(5)}</span>
          </div>
        </section>
      )}

      {stats.topPosts.length > 0 && (
        <section className="rounded-[1.75rem] border border-border bg-background px-5 py-5">
          <div className="mb-5">
            <p className="eyebrow">Top Content</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">热门文章 Top 5</h2>
          </div>
          <div className="overflow-hidden rounded-[1.25rem] border border-border">
            {stats.topPosts.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-4 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="editorial-title text-2xl font-semibold text-accent">
                    0{i + 1}
                  </span>
                  <span className="text-sm text-foreground sm:text-base">{post.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">{post.viewCount} 次浏览</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
