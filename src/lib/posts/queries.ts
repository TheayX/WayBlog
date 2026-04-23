import type { Prisma } from '@generated/prisma/client';
import { PostStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 公开文章卡片列表的统一字段选择。
 *
 * 首页、分类页和标签页使用同一套卡片组件，因此字段选择必须保持一致；
 * 后续如果卡片展示字段变化，只需要修改这一处。
 */
const publicPostListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  publishedAt: true,
  viewCount: true,
  pinned: true,
  category: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true } },
} satisfies Prisma.PostSelect;

/**
 * 公开文章列表统一排序。
 *
 * 所有卡片列表入口都优先展示置顶文章，再按发布时间倒序排列，避免不同聚合页排序体验不一致。
 */
const publicPostListOrderBy = [
  { pinned: 'desc' },
  { publishedAt: 'desc' },
] satisfies Prisma.PostOrderByWithRelationInput[];

/**
 * 后台文章编辑表单所需的数据结构。
 *
 * 这里只保留管理后台真正需要回填的字段，避免把作者、统计等无关信息混入表单载荷，
 * 也让服务端页面与路由处理器可以稳定复用同一份映射结果。
 */
export interface AdminPostEditorData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  pinned: boolean;
  categoryId: string;
  tagIds: string[];
}

/**
 * 公开页文章列表项。
 *
 * 列表卡片需要保留正文回退摘要所需的 `content`，其余字段只保留展示入口真正会用到的最小集合，
 * 避免公开页列表在不同页面里散落近似但不完全一致的查询定义。
 */
export interface PublicPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  viewCount: number;
  pinned: boolean;
  category: { name: string; slug: string } | null;
  tags: Array<{ name: string; slug: string }>;
}

/**
 * 公开页文章元数据所需字段。
 *
 * `generateMetadata` 和正文详情页都应遵守“只读取已发布文章”的同一条公开边界，
 * 因此单独抽出一份稳定结构，避免元数据入口意外读取到草稿。
 */
export interface PublicPostMetadata {
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  author: { name: string } | null;
  tags: Array<{ name: string }>;
}

/**
 * 公开页文章详情结构。
 *
 * 详情页需要正文、分类、标签、作者和浏览量，但不需要把后台编辑场景的字段混进来。
 * 这里集中定义后，后续详情页改动可以统一收敛在领域查询层。
 */
export interface PublicPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  author: { name: string; avatar: string | null };
  category: { name: string; slug: string } | null;
  tags: Array<{ name: string; slug: string }>;
}

/** 详情页上下篇导航所需的最小结构。 */
export interface PostNavigationItem {
  slug: string;
  title: string;
}

/** 归档页按时间线展示所需的文章最小结构。 */
export interface PublicArchivePost {
  slug: string;
  title: string;
  publishedAt: Date | null;
}

/** RSS 输出所需的公开文章最小结构。 */
export interface PublicFeedPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date | null;
  author: { name: string } | null;
  category: { name: string } | null;
}

/** sitemap 文章项所需的最小结构。 */
export interface PublicSitemapPost {
  slug: string;
  updatedAt: Date;
}

/**
 * 将帖子实体收敛为后台编辑页使用的最小数据结构。
 *
 * 这样做可以把 Prisma 查询结果和前端表单载荷解耦，后续即便详情查询增加了关联字段，
 * 也不会让管理后台表单被动跟着承接额外数据。
 */
function toAdminPostEditorData(post: {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: PostStatus;
  pinned: boolean;
  categoryId: string | null;
  tags: Array<{ id: string }>;
}): AdminPostEditorData {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || '',
    coverImage: post.coverImage || '',
    status: post.status,
    pinned: post.pinned,
    categoryId: post.categoryId || '',
    tagIds: post.tags.map((tag) => tag.id),
  };
}

/**
 * 获取后台编辑页使用的文章数据。
 *
 * 此查询不承担鉴权职责，只负责读取并映射后台编辑场景所需字段；
 * 调用方必须明确处于受保护的管理后台或已经完成鉴权的接口中。
 */
export async function getAdminPostEditorData(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      status: true,
      pinned: true,
      categoryId: true,
      tags: { select: { id: true } },
    },
  });

  return post ? toAdminPostEditorData(post) : null;
}

/**
 * 获取公开首页等列表场景使用的已发布文章分页结果。
 *
 * 公开列表统一按“置顶优先、发布时间倒序”的规则排序，避免首页、分类页等入口各自定义排序语义。
 */
export async function getPublishedPostsPage(page: number, pageSize: number) {
  const where = { status: PostStatus.PUBLISHED } as const;

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: publicPostListSelect,
      orderBy: publicPostListOrderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

/**
 * 获取某个分类下的已发布文章分页结果。
 *
 * 分类实体是否存在由 taxonomies 查询层判断；这里仅负责维护文章公开可见性、排序与列表字段。
 */
export async function getPublishedPostsPageByCategory(
  categoryId: string,
  page: number,
  pageSize: number,
) {
  const where = { status: PostStatus.PUBLISHED, categoryId } as const;

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: publicPostListSelect,
      orderBy: publicPostListOrderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

/**
 * 获取某个标签下的已发布文章分页结果。
 *
 * 标签页和首页复用同一套列表字段与排序规则，只在 where 条件中追加标签关联约束。
 */
export async function getPublishedPostsPageByTag(tagId: string, page: number, pageSize: number) {
  const where = {
    status: PostStatus.PUBLISHED,
    tags: { some: { id: tagId } },
  } as const;

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: publicPostListSelect,
      orderBy: publicPostListOrderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

/**
 * 获取归档页时间线所需的已发布文章列表。
 *
 * 归档只需要标题、slug 与发布时间，因此不复用卡片列表查询，避免额外读取正文和关联数据。
 */
export async function getPublishedArchivePosts() {
  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: {
      slug: true,
      title: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });
}

/**
 * 获取 RSS 使用的最新已发布文章。
 *
 * 该查询仅返回 feed 所需字段，避免 RSS 路由为了订阅输出读取多余关联数据。
 */
export async function getPublishedFeedPosts(limit: number) {
  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

/**
 * 获取 sitemap 使用的公开文章 URL 列表。
 *
 * sitemap 只关心 slug 与更新时间，因此保持最小字段选择即可。
 */
export async function getPublishedSitemapPosts() {
  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
}

/**
 * 获取公开页文章元数据。
 *
 * 只返回已发布文章的 SEO 所需字段，确保元数据生成逻辑不会绕过公开可见性边界。
 */
export async function getPublishedPostMetadata(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: PostStatus.PUBLISHED },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });
}

/**
 * 获取公开文章详情。
 *
 * 详情页正文和结构化数据都依赖这份查询结果，因此这里集中约束“只读已发布文章”，
 * 避免前台页面再次各自拼接 where 条件。
 */
export async function getPublishedPostDetail(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: PostStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
      viewCount: true,
      author: { select: { name: true, avatar: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
}

/**
 * 获取公开文章详情页的上下篇导航。
 *
 * 这里沿用现有规则：比当前发布时间更晚的是“上一篇”，更早的是“下一篇”，
 * 统一由领域查询层维护，避免详情页自己再次组合两条近似查询。
 */
export async function getPublishedPostNavigation(publishedAt: Date) {
  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { gt: publishedAt },
      },
      orderBy: { publishedAt: 'asc' },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lt: publishedAt },
      },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true },
    }),
  ]);

  return { prevPost, nextPost };
}
