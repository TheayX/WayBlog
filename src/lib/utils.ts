import { clsx, type ClassValue } from 'clsx';
import { pinyin } from 'pinyin-pro';

/**
 * 合并条件 className。
 *
 * 当前项目未引入 `tailwind-merge`，这里只负责根据条件拼接类名，
 * 不处理 Tailwind 冲突类的覆盖关系。
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 将标题或自由文本转换为适合用作文章路径片段的 slug。
 *
 * 中文会先被转成不带音调的拼音，随后再统一清洗空格、下划线和非法字符。
 * 这里只保证格式稳定，不负责唯一性校验；唯一性由路由处理器层保证。
 */
export function slugify(text: string): string {
  // 先把中文转换为连续拼音，尽量保留可读性，再统一进入 slug 清洗流程。
  const py = pinyin(text, { toneType: 'none', nonZh: 'consecutive' });

  return py
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 按中文完整日期格式展示日期。
 * 适合文章详情、归档等面向阅读的场景。
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 按简短数字格式展示日期。
 * 适合列表、后台表格等对紧凑性要求更高的场景。
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 将日期值安全转换为 ISO 字符串。
 * 兼容查询层返回 `Date` 或已序列化字符串两种情况，避免页面层重复判断实例类型。
 */
export function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * 将日期值安全转换为 Date 实例。
 * 适合需要继续读取年、月、日等结构化字段的页面，避免直接假设查询结果一定是原生 Date。
 */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 按指定长度截断文本，常用于列表摘要或搜索预览。
 */
export function truncate(text: string, length: number = 200): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * 去除文本中的 emoji 字符。
 * 用于不希望出现表情符号的页面文案收口，避免直接污染页面视觉风格。
 * 这里不用 Unicode 属性类写法，优先兼容当前工具链对正则的解析能力。
 */
export function stripEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
}
