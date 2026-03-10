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
 * 从 Markdown 内容中提取 h2–h4 标题，生成目录
 */
function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[`*_~[\]()]/g, '').trim();
      // rehype-slug 生成的 id 规则：小写、空格替换为连字符、移除特殊字符
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

