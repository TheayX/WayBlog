import { clsx, type ClassValue } from 'clsx';
import { pinyin } from 'pinyin-pro';

// ─── className 合并工具 ───
// 简化版：不引入 tailwind-merge，直接用 clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Slug 生成 ───
export function slugify(text: string): string {
  // 1. 将中文转换为无音调拼音，非中文字符保持连续
  const py = pinyin(text, { toneType: 'none', nonZh: 'consecutive' });
  
  // 2. 将结果转换格式
  return py
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')     // 将空格、下划线转为连字符
    .replace(/[^\w-]+/g, '')     // 仅保留字母、数字和连字符
    .replace(/--+/g, '-')        // 多个连续连字符合并为一
    .replace(/^-+|-+$/g, '');    // 去除首尾连字符
}

// ─── 日期格式化 ───
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── 截取摘要 ───
export function truncate(text: string, length: number = 200): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

