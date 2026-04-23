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
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
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


