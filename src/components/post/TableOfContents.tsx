'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

/**
 * 文章目录组件。
 *
 * 根据 Markdown 原文提取 h2-h4 标题，并结合可见区域高亮当前阅读位置，
 * 让长文在前台页面中保持更好的可跳转性。
 * 这里只展示 h2-h4，目的是在信息密度和可读性之间取平衡，避免目录因层级过深而失去可扫读性。
 */
function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[`*_~[\]()]/g, '').trim();
      // 这里使用一套与页面标题锚点接近的本地 slug 规则，确保目录链接在常见中文/英文标题下可稳定跳转。
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fff-]/g, '');
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');
  const headings = extractHeadings(content);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个可见的标题
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    );

    // 观察所有标题元素
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block" aria-label="目录">
      <div className="sticky top-24">
        <p className="mb-3 text-sm font-semibold text-foreground">目录</p>
        <ul className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 16}px` }}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(heading.id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    setActiveId(heading.id);
                  }
                }}
                className={`block rounded px-2 py-1 transition-colors hover:text-primary ${
                  activeId === heading.id
                    ? 'border-l-2 border-primary text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

