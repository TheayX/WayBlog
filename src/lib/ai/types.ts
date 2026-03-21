export interface AiOption {
  id: string;
  name: string;
}

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

export type AiField = 'title' | 'slug' | 'content' | 'excerpt' | 'category' | 'tags';

export interface AiFieldInput extends AiOptimizeInput {
  field: AiField;
}

export interface AiSuggestionCategory {
  id?: string;
  name: string;
  reason?: string;
}

export interface AiSuggestionTag {
  id?: string;
  name: string;
  reason?: string;
  isNew?: boolean;
}

export interface AiOptimizeResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySuggestion: AiSuggestionCategory | null;
  tagSuggestions: AiSuggestionTag[];
  warnings: string[];
}

export interface AiFieldResult {
  field: AiField;
  value?: string;
  categorySuggestion?: AiSuggestionCategory | null;
  tagSuggestions?: AiSuggestionTag[];
  warnings: string[];
}
