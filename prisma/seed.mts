import * as PrismaModule from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

/**
 * 开发环境种子脚本。
 *
 * 用于初始化管理员账号、基础分类标签、欢迎文章、友链与 about 页面，
 * 让本地启动后立即具备可登录、可浏览、可演示的最小博客数据集。
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
] as const;

const defaultFriendLinks = [
  {
    name: 'Next.js',
    url: 'https://nextjs.org',
    description: '用于参考 React 全栈框架的官方能力与文档',
    sortOrder: 1,
  },
  {
    name: 'Prisma',
    url: 'https://www.prisma.io',
    description: '用于参考数据库访问层与 Schema 设计能力',
    sortOrder: 2,
  },
] as const;

const defaultAboutPage = {
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
} as const;

const welcomePostContent = `# 欢迎来到 Way

这是一篇初始化文章，用于确认前台展示、后台编辑、分类标签和 Markdown 渲染都能正常工作。

## 当前状态

项目已经具备公开前台、管理后台、搜索、浏览量统计和基础内容管理能力。

## 建议的后续动作

- 在后台完善关于页和友链
- 用真实文章替换这篇初始化内容
- 根据需要继续补充部署、备份和监控边界

如果你能看到这篇文章，说明基础内容链路已经准备就绪。`;

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
 * 执行种子填充。
 * 采用 upsert/存在性检查保证多次运行脚本时不会不断制造重复基础数据。
 */
async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 创建管理员
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
  console.log(`✅ 管理员创建成功: ${admin.email}`);

  // 2. 创建分类
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ 分类创建成功: ${defaultCategories.map((c) => c.name).join(', ')}`);

  // 3. 创建标签
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✅ 标签创建成功: ${defaultTags.map((t) => t.name).join(', ')}`);

  // 4. 创建欢迎文章
  const techCategory = await prisma.category.findUnique({ where: { slug: 'engineering' } });
  const nextjsTag = await prisma.tag.findUnique({ where: { slug: 'nextjs' } });
  const tsTag = await prisma.tag.findUnique({ where: { slug: 'typescript' } });

  const connectTags = [nextjsTag, tsTag]
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map((t) => ({ id: t.id }));

  await prisma.post.upsert({
    where: { slug: 'welcome-to-way' },
    update: {},
    create: {
      title: '欢迎来到 Way',
      slug: 'welcome-to-way',
      content: welcomePostContent,
      excerpt: 'WayBlog 的本地演示文章，用于验证博客基础内容链路。',
      status: 'PUBLISHED',
      pinned: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: techCategory?.id,
      tags: {
        connect: connectTags,
      },
    },
  });
  console.log('✅ 欢迎文章创建成功');

  // 5. 创建友情链接
  for (const link of defaultFriendLinks) {
    const existing = await prisma.friendLink.findFirst({ where: { name: link.name } });
    if (!existing) {
      await prisma.friendLink.create({ data: link });
    }
  }
  console.log(`✅ 友情链接创建成功: ${defaultFriendLinks.map((l) => l.name).join(', ')}`);

  // 6. 创建 About 页面
  await prisma.page.upsert({
    where: { slug: defaultAboutPage.slug },
    update: {},
    create: defaultAboutPage,
  });
  console.log('✅ About 页面创建成功');

  console.log('\n🎉 种子数据填充完成！');
  console.log(`📧 管理员邮箱: ${maskEmail(email)}`);
  console.log(`🔑 管理员密码: ${maskSecret(password)}（明文仅保存在本地 .env 中）`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 种子数据填充失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
