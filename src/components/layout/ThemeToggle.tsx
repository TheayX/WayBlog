'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * 主题切换按钮。
 *
 * 为避免服务端渲染与客户端主题状态不一致，组件会等待挂载完成后再展示真实图标。
 * mounted 为 false 时只渲染占位按钮，目的是消除 hydration mismatch 带来的闪烁和警告。
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <button
        className="h-11 w-11 rounded-full border border-border bg-background"
        aria-label="切换主题"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
      aria-label="切换主题"
    >
      {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}
