import type { Post, Category, Tag, PageView, FriendLink, Page, User } from '@/generated/prisma';

/**
 * 文章及其列表/详情页常用关联数据。
 * 统一约定作者、分类和标签的最小字段集合，避免在不同查询结果里重复定义相近结构。
 */
export type PostWithRelations = Post & {
  author: Pick<User, 'id' | 'name' | 'avatar'>;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[];
};

/**
 * 文章列表项。
 * 刻意去掉正文内容，避免列表接口和列表页携带过重的字段。
 */
export type PostListItem = Omit<PostWithRelations, 'content'>;

/** 分类及其文章数量，常用于后台管理统计和公开页导航。 */
export type CategoryWithCount = Category & {
  _count: { posts: number };
};

/** 标签及其文章数量，常用于标签页和后台管理统计。 */
export type TagWithCount = Tag & {
  _count: { posts: number };
};

/**
 * 搜索结果结构。
 * `highlight` 由全文搜索结果生成，用于在搜索页展示命中的摘要片段。
 */
export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  highlight: string;
  publishedAt: Date | null;
  category: Pick<Category, 'name' | 'slug'> | null;
  tags: Pick<Tag, 'name' | 'slug'>[];
}

/** 后台仪表盘聚合数据结构。 */
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

/** 后台分类管理页列表项。 */
export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

/** 后台标签管理页列表项。 */
export interface AdminTagItem {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

/** 后台友链管理页列表项。 */
export interface AdminFriendLinkItem {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string | null;
  sortOrder: number;
}

/** 后台文章管理页列表项。 */
export interface AdminPostListItem {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  pinned: boolean;
  publishedAt: string | null;
  viewCount: number;
  category: { name: string } | null;
  tags: { name: string }[];
  createdAt: string;
}

/** 统一的分页响应结构，供前后台列表接口共享。 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 统一的接口错误响应结构。 */
export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

/** 继续导出 Prisma 原始模型类型，便于需要底层类型时直接复用。 */
export type { Post, Category, Tag, PageView, FriendLink, Page, User };

