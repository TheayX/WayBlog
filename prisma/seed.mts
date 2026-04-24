import { PrismaPg } from '@prisma/adapter-pg';
import * as PrismaModule from '../generated/prisma/client';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

/**
 * 开发环境种子脚本。
 *
 * 该脚本只负责初始化一套“足够演示、可直接进入后台维护”的默认数据：
 * - 管理员账号
 * - 分类、标签
 * - 多篇示例文章
 * - 友情链接
 * - 单页内容
 *
 * 默认数据的目标是帮助本地环境快速起步，而不是替代后台作为长期维护入口。
 */
config();

type PrismaClientModule = typeof import('../generated/prisma/client');

// 兼容 tsx 以 CJS 方式加载生成客户端时的 default 包装差异。
const mod =
  (PrismaModule as PrismaClientModule & { default?: PrismaClientModule }).default ?? PrismaModule;
const PrismaClient = mod.PrismaClient;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: '工程实践', slug: 'engineering', description: '项目开发、架构取舍与工程化记录' },
  { name: '学习笔记', slug: 'notes', description: '阅读、课程和日常学习沉淀' },
  { name: '生活随笔', slug: 'life', description: '生活观察、阶段复盘和个人表达' },
] as const;

const defaultTags = [
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'React', slug: 'react' },
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'Prisma', slug: 'prisma' },
  { name: '写作', slug: 'writing' },
  { name: '复盘', slug: 'review' },
] as const;

const defaultFriendLinks = [
  {
    name: 'Next.js',
    url: 'https://nextjs.org',
    description: '用于参考 React 全栈框架的官方能力与文档。',
    sortOrder: 1,
  },
  {
    name: 'Prisma',
    url: 'https://www.prisma.io',
    description: '用于参考数据库访问层、Schema 设计和迁移工作流。',
    sortOrder: 2,
  },
  {
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: '用于参考当前项目使用的样式体系和设计令牌组织方式。',
    sortOrder: 3,
  },
] as const;

const defaultPages = [
  {
    slug: 'about',
    title: '关于',
    content: `# 关于

这里是一页默认的初始化单页，用于确认单页渲染、后台维护和公开展示链路都已经正常工作。

## 当前约定

- 品牌名、公开邮箱、GitHub 链接、首页和页脚固定文案由 \`src/config/site.ts\` 维护
- 关于页正文、友链、文章、分类和标签属于数据库内容，应通过后台维护

## 接下来建议

- 到后台的“单页管理”里完善这页内容
- 到后台的“友链管理”里替换默认示例链接
- 保持 slug 稳定，避免影响公开路由

如果你现在看到的是这段内容，说明数据库内容链路已经可用，但它仍然只是初始化占位文本。`,
  },
] as const;

const defaultPosts = [
  {
    title: '欢迎来到 Way',
    slug: 'welcome-to-way',
    excerpt: '初始化文章，用于确认博客的基础内容链路已经可以正常工作。',
    content: `# 欢迎来到 Way

这是一篇初始化文章，用于确认前台展示、后台编辑、分类标签和 Markdown 渲染都能正常工作。

## 当前状态

项目已经具备公开前台、管理后台、搜索、浏览量统计和基础内容管理能力。

## 建议的后续动作

- 在后台完善关于页和友链
- 用真实文章替换这篇初始化内容
- 根据需要继续补充部署、备份和监控边界

如果你能看到这篇文章，说明基础内容链路已经准备就绪。`,
    categorySlug: 'engineering',
    tagSlugs: ['nextjs', 'typescript', 'prisma'],
    pinned: true,
    publishedAt: daysAgo(0),
  },
  {
    title: '如何给项目建立清晰的配置边界',
    slug: 'configuration-boundary',
    excerpt: '环境变量、站点固定资料和数据库内容三者分开后，维护成本会显著下降。',
    content: `# 如何给项目建立清晰的配置边界

一个内容型项目最容易堆乱的地方，不是页面，而是配置和数据边界。

## 三种信息不要混

### 1. 环境变量

适合放密钥、部署地址和会随环境变化的配置。

### 2. 站点固定资料

适合放品牌名、固定公开邮箱、GitHub 链接、首页和页脚文案。

### 3. 数据库内容

适合放文章、关于页、友链和其他希望在后台维护的内容。

## 为什么要尽早分开

- 改文案时，不需要再碰部署配置
- 改数据库内容时，后台操作就能立即生效
- 代码里不再出现同一份信息的多处散落硬编码

这类边界一旦在项目早期就约定清楚，后续功能迭代会轻很多。`,
    categorySlug: 'engineering',
    tagSlugs: ['typescript', 'writing'],
    pinned: false,
    publishedAt: daysAgo(3),
  },
  {
    title: '最近一轮后台重构后的取舍记录',
    slug: 'admin-redesign-notes',
    excerpt: '这篇文章用于展示一个更偏复盘风格的内容样例，便于测试不同类型文章的列表呈现。',
    content: `# 最近一轮后台重构后的取舍记录

这篇文章用来模拟“阶段复盘型”内容，而不是教程型正文。

## 这轮做了什么

- 统一了前后台的设计语言
- 清理了散落的重复样式和零散常量
- 把数据库内容和固定站点资料的边界重新梳理清楚

## 哪些没有继续做

- 没有提前把站点资料后台化
- 没有为了抽象而引入新的配置式系统
- 没有把种子脚本继续当成长期内容维护入口

## 结论

能在后台维护的内容，就归数据库。
属于全站固定资料的内容，就留在站点配置文件里。

看起来简单，但这类边界决定了项目后续会不会越改越乱。`,
    categorySlug: 'life',
    tagSlugs: ['review', 'writing'],
    pinned: false,
    publishedAt: daysAgo(8),
  },
] as const;

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function maskEmail(email?: string | null) {
  if (!email) return 'unknown';

  const [localPart, domain] = email.toLowerCase().split('@');
  if (!domain) return '***';

  const visiblePrefix = localPart.slice(0, 2);
  return `${visiblePrefix}${'*'.repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
}

function maskSecret(value?: string | null) {
  return value ? '********' : 'not-set';
}

/**
 * 创建管理员账号。
 *
 * 账号信息仍由环境变量驱动，这样在不同开发机上可以快速替换初始化登录凭据，
 * 但它只参与初始化，不属于站点的长期公开配置。
 */
async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@wayblog.local';
  const password = process.env.ADMIN_PASSWORD || 'way-local-demo-password';
  const name = process.env.ADMIN_NAME || 'Way';

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('生产环境运行 seed 时必须显式配置 ADMIN_PASSWORD');
  }

  const passwordHash = await hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name,
    },
  });

  console.log(`管理员初始化完成: ${maskEmail(admin.email)}`);
  return { admin, password };
}

/** 初始化分类。 */
async function seedCategories() {
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log(`分类初始化完成: ${defaultCategories.map((item) => item.name).join('、')}`);
}

/** 初始化标签。 */
async function seedTags() {
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log(`标签初始化完成: ${defaultTags.map((item) => item.name).join('、')}`);
}

/**
 * 读取分类和标签映射。
 *
 * 后续文章初始化按 slug 绑定分类和标签，避免在默认数据里直接写数据库 id。
 */
async function getTaxonomyMaps() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.tag.findMany({ select: { id: true, slug: true } }),
  ]);

  return {
    categoryIdBySlug: new Map(categories.map((item) => [item.slug, item.id])),
    tagIdBySlug: new Map(tags.map((item) => [item.slug, item.id])),
  };
}

/**
 * 初始化文章。
 *
 * 初始化文章不追求数量很多，而是覆盖首页、分类、标签和后台列表最常见的展示场景，
 * 这样本地启动后可以直接验证卡片、归档和阅读页的主要路径。
 */
async function seedPosts(adminId: string) {
  const { categoryIdBySlug, tagIdBySlug } = await getTaxonomyMaps();

  for (const post of defaultPosts) {
    const categoryId = categoryIdBySlug.get(post.categorySlug) || null;
    const tagIds = post.tagSlugs
      .map((slug) => tagIdBySlug.get(slug))
      .filter((tagId): tagId is string => Boolean(tagId));

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        status: 'PUBLISHED',
        pinned: post.pinned,
        publishedAt: post.publishedAt,
        authorId: adminId,
        categoryId,
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
    });
  }

  console.log(`文章初始化完成: ${defaultPosts.map((item) => item.title).join('、')}`);
}

/**
 * 初始化友情链接。
 *
 * 友链没有唯一约束，这里仍按名称做最小存在性检查，
 * 目标只是避免重复写入默认示例数据，而不是替代后台进行长期维护。
 */
async function seedFriendLinks() {
  for (const link of defaultFriendLinks) {
    const existing = await prisma.friendLink.findFirst({ where: { name: link.name } });
    if (!existing) {
      await prisma.friendLink.create({ data: link });
    }
  }

  console.log(`友链初始化完成: ${defaultFriendLinks.map((item) => item.name).join('、')}`);
}

/**
 * 初始化单页。
 *
 * 当前默认只创建 about，避免生成过多前台暂未接入的固定页面；
 * 需要更多单页时，建议先明确路由和展示入口，再补默认内容。
 */
async function seedPages() {
  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log(`单页初始化完成: ${defaultPages.map((item) => item.slug).join('、')}`);
}

/**
 * 执行种子填充。
 *
 * 脚本默认按“管理员 -> 分类标签 -> 文章 -> 友链 -> 单页”的顺序初始化，
 * 既保证依赖关系清晰，也便于后续继续增加默认内容类别。
 */
async function main() {
  console.log('开始填充种子数据...');

  const { admin, password } = await seedAdminUser();
  await seedCategories();
  await seedTags();
  await seedPosts(admin.id);
  await seedFriendLinks();
  await seedPages();

  console.log('\n种子数据填充完成。');
  console.log(`管理员邮箱: ${maskEmail(admin.email)}`);
  console.log(`管理员密码: ${maskSecret(password)}（明文仅保存在本地 .env 中）`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('种子数据填充失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
