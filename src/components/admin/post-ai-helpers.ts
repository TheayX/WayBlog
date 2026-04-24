import type { Dispatch, SetStateAction } from 'react';
import type { AiField, AiFieldResult, AiOptimizeResult, AiSuggestionTag } from '@/lib/ai/types';

interface NamedOption {
  id: string;
  name: string;
}

interface PostAiFormSetters {
  setTitle: Dispatch<SetStateAction<string>>;
  setSlug: Dispatch<SetStateAction<string>>;
  setContent: Dispatch<SetStateAction<string>>;
  setExcerpt: Dispatch<SetStateAction<string>>;
  setCategoryId: Dispatch<SetStateAction<string>>;
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
  setSlugManuallyEdited: Dispatch<SetStateAction<boolean>>;
}

/**
 * 将 AI 推荐分类映射到当前已存在分类。
 *
 * 模型返回的建议未必总带 `id`，因此这里优先使用明确 id，
 * 否则退回到基于名称的大小写不敏感匹配。
 */
export function getMatchedCategoryId(
  categories: NamedOption[],
  result: { categorySuggestion?: AiOptimizeResult['categorySuggestion'] },
) {
  const suggestion = result.categorySuggestion;
  if (!suggestion) return '';

  if (suggestion.id) return suggestion.id;

  const matched = categories.find(
    (item) => item.name.toLowerCase() === suggestion.name.toLowerCase(),
  );

  return matched?.id || '';
}

/**
 * 将 AI 推荐标签映射为当前可直接应用的标签 id 集合。
 *
 * 这里只回填已存在标签；标记为 isNew 的建议保留给人工判断，
 * 避免前端直接伪造不存在的关联 id。
 */
export function getMatchedTagIds(
  tags: NamedOption[],
  result: { tagSuggestions?: AiSuggestionTag[] },
) {
  const suggestions = result.tagSuggestions || [];

  const ids = suggestions
    .filter((item) => !item.isNew)
    .map((item) => {
      if (item.id) return item.id;
      const matched = tags.find((tag) => tag.name.toLowerCase() === item.name.toLowerCase());
      return matched?.id || '';
    })
    .filter(Boolean);

  return Array.from(new Set(ids));
}

/**
 * 获取 AI 字段名对应的中文标签。
 */
export function getAiFieldLabel(field: AiField) {
  switch (field) {
    case 'identity':
      return '标题与链接';
    case 'title':
      return '标题';
    case 'slug':
      return 'Slug';
    case 'content':
      return '正文';
    case 'excerpt':
      return '摘要';
    case 'category':
      return '分类';
    case 'tags':
      return '标签';
  }
}

/**
 * 将单字段 AI 建议应用到表单状态。
 *
 * 返回值用于区分“已成功应用”和“因为未匹配到现有分类/标签而需要人工确认”两种情况，
 * 让 Hook 可以统一决定提示文案，而不是把分支写散。
 */
export function applyAiFieldValue(
  field: AiField,
  result: Pick<
    AiOptimizeResult,
    'title' | 'slug' | 'content' | 'excerpt' | 'categorySuggestion' | 'tagSuggestions'
  >,
  categories: NamedOption[],
  tags: NamedOption[],
  setters: PostAiFormSetters,
) {
  switch (field) {
    case 'identity':
      setters.setTitle(result.title);
      setters.setSlug(result.slug);
      setters.setSlugManuallyEdited(true);
      return { success: true as const };
    case 'title':
      setters.setTitle(result.title);
      return { success: true as const };
    case 'slug':
      setters.setSlug(result.slug);
      setters.setSlugManuallyEdited(true);
      return { success: true as const };
    case 'content':
      setters.setContent(result.content);
      return { success: true as const };
    case 'excerpt':
      setters.setExcerpt(result.excerpt);
      return { success: true as const };
    case 'category': {
      const matchedCategoryId = getMatchedCategoryId(categories, result);
      if (!matchedCategoryId) {
        return { success: false as const, reason: 'category' as const };
      }
      setters.setCategoryId(matchedCategoryId);
      return { success: true as const };
    }
    case 'tags': {
      const matchedTagIds = getMatchedTagIds(tags, result);
      if (matchedTagIds.length === 0) {
        return { success: false as const, reason: 'tags' as const };
      }
      setters.setSelectedTagIds(matchedTagIds);
      return { success: true as const };
    }
  }
}

/**
 * 将字段级 AI 接口返回值归一化为统一的可应用结构。
 */
export function normalizeFieldResult(result: AiFieldResult) {
  const emptyResult = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categorySuggestion: null,
    tagSuggestions: [],
  };

  switch (result.field) {
    case 'identity':
      return {
        ...emptyResult,
        title: result.title || '',
        slug: result.slug || '',
      };
    case 'title':
      return {
        ...emptyResult,
        title: result.value || '',
      };
    case 'slug':
      return {
        ...emptyResult,
        slug: result.value || '',
      };
    case 'content':
      return {
        ...emptyResult,
        content: result.value || '',
      };
    case 'excerpt':
      return {
        ...emptyResult,
        excerpt: result.value || '',
      };
    case 'category':
      return {
        ...emptyResult,
        categorySuggestion: result.categorySuggestion || null,
      };
    case 'tags':
      return {
        ...emptyResult,
        tagSuggestions: result.tagSuggestions || [],
      };
  }
}
