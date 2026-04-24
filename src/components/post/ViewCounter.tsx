'use client';

import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ViewCounterProps {
  postId: string;
  initialCount: number;
}

/**
 * 浏览量显示组件。
 *
 * 先展示服务端渲染提供的初始值，再在客户端异步上报浏览事件并回填最新计数，
 * 兼顾首屏稳定性与阅读统计的实时更新。
 * 上报失败时静默降级到初始值，避免统计链路波动影响前台页面阅读体验。
 */
export function ViewCounter({ postId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // 浏览统计不阻断阅读流程，只在客户端静默更新。
    fetch(`/api/posts/${postId}/views`, { method: 'POST' })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (data?.data?.viewCount) {
          setCount(data.data.viewCount);
        }
      })
      .catch(() => {
        // 保持静默失败，避免前台阅读体验被统计请求打断。
      });
  }, [postId]);

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>{count} 次浏览</span>
    </span>
  );
}
