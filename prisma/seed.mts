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
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    description: '用于参考现代前端项目的部署、预览和发布体验。',
    sortOrder: 4,
  },
] as const;

const defaultPages = [
  {
    slug: 'about',
    title: '关于',
    content: `# 关于

这里是一页默认的初始化单页，用于确认单页渲染、后台维护和公开展示链路都已经正常工作。

## 这个站点适合写什么

- 工程实践里的真实取舍
- 学习过程中的整理型笔记
- 阶段复盘和少量生活随笔

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
    title: '从零整理一个内容型项目时，我会先画哪几条边界',
    slug: 'content-project-boundaries',
    excerpt: '页面、配置、数据库和后台能力如果一开始就混在一起，后面几乎一定会越改越乱。',
    content: `# 从零整理一个内容型项目时，我会先画哪几条边界

内容型项目最怕的不是功能少，而是边界模糊。

## 我通常最先确认三件事

### 页面只是展示层

页面负责渲染，不应该顺手承接数据约束、权限判断和初始化逻辑。

### 固定站点资料和数据库内容分开

品牌名、公开邮箱、GitHub 链接这类固定资料，和文章、关于页、友链这种可运营内容不是一回事。

### 数据库内容必须有后台入口

如果前台在读数据库，那后台就应该能维护它，否则改一次内容就要绕回 seed 或手改数据库。

## 为什么这篇文章放在首页附近

因为它很适合作为初始化站点的第一批内容：

- 能解释项目方向
- 能验证分类、标签和摘要展示
- 能和关于页形成互补

这类文章不一定很长，但要足够明确，让第一次打开站点的人知道这里会写什么。`,
    categorySlug: 'engineering',
    tagSlugs: ['typescript', 'writing'],
    pinned: false,
    publishedAt: daysAgo(2),
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
    publishedAt: daysAgo(5),
  },
  {
    title: '整理学习笔记时，先保留问题而不是急着写答案',
    slug: 'notes-start-from-questions',
    excerpt: '很多学习笔记写到最后会变成资料摘抄，真正有价值的往往是你当时卡住的问题。',
    content: `# 整理学习笔记时，先保留问题而不是急着写答案

学习笔记最容易走偏的地方，是把它写成一份平整但没有重点的抄录稿。

## 我现在更倾向这样做

### 先记录问题

把当时真正卡住你的点写下来，比直接复制标准答案更重要。

### 再记录自己的判断过程

为什么一开始会理解错，后来又是怎么转过来的，这部分往往比结论本身更值得回看。

### 最后才整理成稳定结论

等一个问题反复出现几次之后，再把它收束成更适合长期保存的笔记。

## 为什么这种写法更适合个人站点

因为个人站点不只是知识库，它也应该保留思考轨迹。

如果一篇笔记既有过程，也有结论，那么几个月后回头看时，你更容易重新进入当时的语境。`,
    categorySlug: 'notes',
    tagSlugs: ['writing', 'review'],
    pinned: false,
    publishedAt: daysAgo(9),
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
    publishedAt: daysAgo(14),
  },
  {
    title: '最近重新找回稳定写作节奏的一点体会',
    slug: 'writing-rhythm-after-refactor',
    excerpt: '写作节奏的恢复，很多时候不是靠自律，而是靠把表达门槛降下来。',
    content: `# 最近重新找回稳定写作节奏的一点体会

有一段时间，我总觉得要等到“准备充分”才能写。

后来发现，这种想法通常只会让草稿越来越多，真正发出去的内容越来越少。

## 后来我调整了几件事

### 先允许文章不完整

一篇文章只要有一个明确问题和一个可读结论，就已经值得发布。

### 把后台流程尽量收短

如果发布一篇内容要在多个入口之间来回切换，人就会自然拖延。

### 让默认页面看起来像站点而不是空壳

当首页、关于页和归档页都已经像一个真实站点时，写作本身也更容易进入状态。

## 最后的结论

写作节奏不只是内容问题，也和工具边界、后台流程、页面反馈有关。

当这些地方顺了，输出会自然稳定很多。`,
    categorySlug: 'life',
    tagSlugs: ['writing', 'review'],
    pinned: false,
    publishedAt: daysAgo(21),
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
