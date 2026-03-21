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
