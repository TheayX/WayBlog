/** AI 场景下可供模型选择的分类或标签候选项。 */
export interface AiOption {
  id: string;
  name: string;
}

/**
 * taxonomy suggestion v2 推荐档位。
 * 用档位而不是百分比，避免把模型的主观判断伪装成精确分数。
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

/** taxonomy suggestion v2 基础结构。 */
interface AiTaxonomySuggestionBase {
  name: string;
  level: AiTaxonomySuggestionLevel;
  reason?: string;
}

/** taxonomy suggestion v2 中可直接应用的现有分类。 */
export interface AiSelectedCategorySuggestion extends AiTaxonomySuggestionBase {
  id?: string;
}

/** taxonomy suggestion v2 中更贴切的新分类建议。 */
export interface AiSuggestedCategoryCandidate extends AiTaxonomySuggestionBase {
  isNew?: boolean;
}

/** taxonomy suggestion v2 中可直接应用的现有标签。 */
export interface AiSelectedTagSuggestion extends AiTaxonomySuggestionBase {
  id?: string;
}

/** taxonomy suggestion v2 中建议新增的标签。 */
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

/**
 * v1 旧版 taxonomy 建议结构，仅用于 normalizer 兼容映射。
 * 保留它是为了明确记录这是 taxonomy suggestion v2 的渐进式演进。
 */
export interface AiSuggestionCategory {
  id?: string;
  name: string;
  reason?: string;
}

/** v1 旧版标签建议结构，仅用于兼容映射。 */
export interface AiSuggestionTag {
  id?: string;
  name: string;
  reason?: string;
  isNew?: boolean;
}
