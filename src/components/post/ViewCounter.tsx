'use client';

import { useEffect, useState } from 'react';

interface ViewCounterProps {
  postId: string;
  initialCount: number;
}

export function ViewCounter({ postId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // 记录浏览量
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
        // 静默失败，不影响用户体验
      });
  }, [postId]);

  return <span>👁 {count} 次浏览</span>;
}

