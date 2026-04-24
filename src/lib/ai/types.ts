/** AI 场景下可供模型选择的分类或标签候选项。 */
export interface AiOption {
  id: string;
  name: string;
}

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

/** AI 推荐的单个分类结果。 */
export interface AiSuggestionCategory {
  id?: string;
  name: string;
  reason?: string;
}

/** AI 推荐的单个标签结果。 */
export interface AiSuggestionTag {
  id?: string;
  name: string;
  reason?: string;
  isNew?: boolean;
}

/** AI 全文优化结果，供管理后台预览并批量应用。 */
export interface AiOptimizeResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySuggestion: AiSuggestionCategory | null;
  tagSuggestions: AiSuggestionTag[];
  warnings: string[];
}

/** AI 单字段优化结果，供编辑器按字段局部应用。 */
export interface AiFieldResult {
  field: AiField;
  value?: string;
  title?: string;
  slug?: string;
  categorySuggestion?: AiSuggestionCategory | null;
  tagSuggestions?: AiSuggestionTag[];
  warnings: string[];
}
