/** AI 场景下可供模型选择的分类或标签候选项。 */
export interface AiOption {
  id: string;
  name: string;
}

/**
 * 分类与标签建议第二版使用的推荐档位。
 * 用档位而不是百分比，避免把模型判断包装成伪精确分数。
 */
export type AiTaxonomySuggestionLevel = 'strong' | 'medium' | 'weak';

/**
 * AI 全文优化输入。
 * 汇总文章主体内容以及现有分类/标签候选项，供提示词生成和结果归一化共同使用。
 */
export interface AiOptimizeInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId?: string | null;
  tagIds: string[];
  categories: AiOption[];
  tags: AiOption[];
}

/** 可单独优化的字段范围。 */
export type AiField = 'identity' | 'title' | 'slug' | 'content' | 'excerpt' | 'category' | 'tags';

/** 单字段优化输入，在全文优化输入基础上追加目标字段。 */
export interface AiFieldInput extends AiOptimizeInput {
  field: AiField;
}

/** 分类与标签建议第二版的基础结构。 */
interface AiTaxonomySuggestionBase {
  name: string;
  level: AiTaxonomySuggestionLevel;
  reason?: string;
}

/** 可直接应用的现有分类。 */
export interface AiSelectedCategorySuggestion extends AiTaxonomySuggestionBase {
  id?: string;
}

/** 更贴切的新分类建议。 */
export interface AiSuggestedCategoryCandidate extends AiTaxonomySuggestionBase {
  isNew?: boolean;
}

/** 可直接应用的现有标签。 */
export interface AiSelectedTagSuggestion extends AiTaxonomySuggestionBase {
  id?: string;
}

/** 建议新增的标签。 */
export interface AiSuggestedTagCandidate extends AiTaxonomySuggestionBase {
  isNew?: boolean;
}

/** AI 全文优化结果，供管理后台预览并批量应用。 */
export interface AiOptimizeResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  selectedCategory: AiSelectedCategorySuggestion | null;
  betterCategorySuggestion: AiSuggestedCategoryCandidate | null;
  selectedTags: AiSelectedTagSuggestion[];
  newTagSuggestions: AiSuggestedTagCandidate[];
  warnings: string[];
}

/** AI 单字段优化结果，供编辑器按字段局部应用。 */
export interface AiFieldResult {
  field: AiField;
  value?: string;
  title?: string;
  slug?: string;
  selectedCategory?: AiSelectedCategorySuggestion | null;
  betterCategorySuggestion?: AiSuggestedCategoryCandidate | null;
  selectedTags?: AiSelectedTagSuggestion[];
  newTagSuggestions?: AiSuggestedTagCandidate[];
  warnings: string[];
}
