import type { Post, Category, Tag, PageView, FriendLink, Page, User } from '@/generated/prisma';

// ─── 文章（含关联数据）───
export type PostWithRelations = Post & {
  author: Pick<User, 'id' | 'name' | 'avatar'>;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[];
};

// ─── 文章列表项（不含 content）───
export type PostListItem = Omit<PostWithRelations, 'content'>;

// ─── 分类（含文章数）───
export type CategoryWithCount = Category & {
  _count: { posts: number };
};

// ─── 标签（含文章数）───
export type TagWithCount = Tag & {
  _count: { posts: number };
};

// ─── 搜索结果 ───
export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  highlight: string;
  publishedAt: Date | null;
  category: Pick<Category, 'name' | 'slug'> | null;
  tags: Pick<Tag, 'name' | 'slug'>[];
}

// ─── 统计仪表盘 ───
export interface DashboardStats {
  totalPosts: number;
  totalPublished: number;
  totalDrafts: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
  recentViews: { date: string; pv: number; uv: number }[];
  topPosts: { id: string; title: string; slug: string; viewCount: number }[];
}

// ─── API 分页响应 ───
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── API 错误响应 ───
export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ─── 导出 Prisma 原始类型 ───
export type { Post, Category, Tag, PageView, FriendLink, Page, User };

