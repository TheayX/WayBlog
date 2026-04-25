import type { Dispatch, SetStateAction } from 'react';
import type {
  AiField,
  AiFieldResult,
  AiOptimizeResult,
  AiSelectedTagSuggestion,
  AiTaxonomySuggestionLevel,
} from '@/lib/ai/types';

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

type AiApplyResult =
  | { success: true }
  | { success: false; reason: 'category' | 'tags' };

type AiApplyPayload = Partial<
  Pick<
    AiOptimizeResult,
    | 'title'
    | 'slug'
    | 'content'
    | 'excerpt'
    | 'selectedCategory'
    | 'betterCategorySuggestion'
    | 'selectedTags'
    | 'newTagSuggestions'
  >
>;

/** 第二版推荐档位对应的中文文案。 */
export function getTaxonomyLevelLabel(level: AiTaxonomySuggestionLevel) {
  switch (level) {
    case 'strong':
      return '十分推荐';
    case 'medium':
      return '推荐';
    case 'weak':
      return '一般推荐';
  }
}

/** 第二版推荐档位对应的简短说明。 */
export function getTaxonomyLevelHint(level: AiTaxonomySuggestionLevel) {
  switch (level) {
    case 'strong':
      return '可直接应用';
    case 'medium':
      return '可用，但建议人工确认';
    case 'weak':
      return '仅供参考';
  }
}

/**
 * 将 AI 推荐分类映射到当前已存在分类。
 * 只有 selectedCategory 参与直接应用。
 */
export function getMatchedCategoryId(
  categories: NamedOption[],
  result: { selectedCategory?: AiOptimizeResult['selectedCategory'] },
) {
  const suggestion = result.selectedCategory;
  if (!suggestion) return '';

  if (suggestion.id) return suggestion.id;

  const matched = categories.find(
    (item) => item.name.toLowerCase() === suggestion.name.toLowerCase(),
  );

  return matched?.id || '';
}

/**
 * 将 AI 推荐标签映射为当前可直接应用的标签 id 集合。
 * 只有 selectedTags 视为可立即应用结果。
 */
export function getMatchedTagIds(
  tags: NamedOption[],
  result: { selectedTags?: AiSelectedTagSuggestion[] },
) {
  const suggestions = result.selectedTags || [];

  const ids = suggestions
    .map((item) => {
      if (item.id) return item.id;
      const matched = tags.find((tag) => tag.name.toLowerCase() === item.name.toLowerCase());
      return matched?.id || '';
    })
    .filter(Boolean);

  return Array.from(new Set(ids));
}

/** 获取 AI 字段名对应的中文标签。 */
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
 * 新增建议会保留展示，但不会直接创建或应用。
 */
export function applyAiFieldValue(
  field: AiField,
  result: AiApplyPayload,
  categories: NamedOption[],
  tags: NamedOption[],
  setters: PostAiFormSetters,
): AiApplyResult {
  switch (field) {
    case 'identity':
      setters.setTitle(result.title || '');
      setters.setSlug(result.slug || '');
      setters.setSlugManuallyEdited(true);
      return { success: true };
    case 'title':
      setters.setTitle(result.title || '');
      return { success: true };
    case 'slug':
      setters.setSlug(result.slug || '');
      setters.setSlugManuallyEdited(true);
      return { success: true };
    case 'content':
      setters.setContent(result.content || '');
      return { success: true };
    case 'excerpt':
      setters.setExcerpt(result.excerpt || '');
      return { success: true };
    case 'category': {
      const matchedCategoryId = getMatchedCategoryId(categories, result);
      if (!matchedCategoryId) {
        return { success: false, reason: 'category' };
      }
      setters.setCategoryId(matchedCategoryId);
      return { success: true };
    }
    case 'tags': {
      const matchedTagIds = getMatchedTagIds(tags, result);
      if (matchedTagIds.length === 0) {
        return { success: false, reason: 'tags' };
      }
      setters.setSelectedTagIds(matchedTagIds);
      return { success: true };
    }
  }
}

/**
 * 将整篇优化结果按字段列表批量应用到表单。
 * 仍复用字段级应用器，避免“全部应用”和单字段应用逐渐演化出两套逻辑。
 */
export function applyAiFields(
  fields: AiField[],
  result: AiApplyPayload,
  categories: NamedOption[],
  tags: NamedOption[],
  setters: PostAiFormSetters,
) {
  const failures: Array<'category' | 'tags'> = [];

  for (const field of fields) {
    const applyResult = applyAiFieldValue(field, result, categories, tags, setters);
    if (!applyResult.success) {
      failures.push(applyResult.reason);
    }
  }

  return {
    success: failures.length === 0,
    failures: Array.from(new Set(failures)),
  };
}

/** 将字段级 AI 接口返回值归一化为统一的可应用结构。 */
export function normalizeFieldResult(result: AiFieldResult) {
  const emptyResult = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    selectedCategory: null,
    betterCategorySuggestion: null,
    selectedTags: [],
    newTagSuggestions: [],
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
        selectedCategory: result.selectedCategory || null,
        betterCategorySuggestion: result.betterCategorySuggestion || null,
      };
    case 'tags':
      return {
        ...emptyResult,
        selectedTags: result.selectedTags || [],
        newTagSuggestions: result.newTagSuggestions || [],
      };
  }
}
