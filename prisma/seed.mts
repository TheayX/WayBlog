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
const mod = (PrismaModule as PrismaClientModule & { default?: PrismaClientModule }).default ?? PrismaModule;
const PrismaClient = mod.PrismaClient;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * 执行种子填充。
 * 采用 upsert/存在性检查保证多次运行脚本时不会不断制造重复基础数据。
 */
async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 创建管理员
  const email = process.env.ADMIN_EMAIL || 'way20031208@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.env.ADMIN_NAME || 'Way';

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
  const categories = [
    { name: '技术', slug: 'tech', description: '技术文章' },
    { name: '生活', slug: 'life', description: '生活随笔' },
    { name: '学习', slug: 'learning', description: '学习笔记' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ 分类创建成功: ${categories.map((c) => c.name).join(', ')}`);

  // 3. 创建标签
  const tags = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'React', slug: 'react' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'PostgreSQL', slug: 'postgresql' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✅ 标签创建成功: ${tags.map((t) => t.name).join(', ')}`);

  // 4. 创建欢迎文章
  const techCategory = await prisma.category.findUnique({ where: { slug: 'tech' } });
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
      content: `# 欢迎来到 Way 👋

这是我的个人技术博客的第一篇文章。

## 关于这个博客

这个博客使用以下技术构建：

- **Next.js** — React 全栈框架
- **TypeScript** — 类型安全
- **Tailwind CSS** — 原子化 CSS
- **PostgreSQL** — 关系型数据库
- **Prisma** — 现代 ORM
- **NextAuth.js** — 认证方案

## 未来计划

- 分享技术学习心得
- 记录项目开发经验
- 探索前沿技术趋势

感谢你的访问，希望这里的内容能对你有所帮助！ 🚀`,
      excerpt: '欢迎来到 Way，这是我的个人技术博客。',
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
  const friendLinks = [
    {
      name: 'Next.js',
      url: 'https://nextjs.org',
      description: 'The React Framework for the Web',
      sortOrder: 1,
    },
    {
      name: 'Prisma',
      url: 'https://www.prisma.io',
      description: 'Next-generation Node.js and TypeScript ORM',
      sortOrder: 2,
    },
  ];

  for (const link of friendLinks) {
    const existing = await prisma.friendLink.findFirst({ where: { name: link.name } });
    if (!existing) {
      await prisma.friendLink.create({ data: link });
    }
  }
  console.log(`✅ 友情链接创建成功: ${friendLinks.map((l) => l.name).join(', ')}`);

  // 6. 创建 About 页面
  await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      slug: 'about',
      title: '关于',
      content: `# 关于我

👋 你好，我是 **Way**。

这是我的个人技术博客，用来记录学习和开发过程中的点滴。

## 技术栈

- 前端：React / Next.js / TypeScript / Tailwind CSS
- 后端：Node.js / PostgreSQL / Prisma
- 工具：Git / Docker / VS Code

## 联系方式

- 📧 邮箱：way20031208@gmail.com
- 🐙 GitHub：[github.com](https://github.com)

欢迎通过以上方式与我交流！`,
    },
  });
  console.log('✅ About 页面创建成功');

  console.log('\n🎉 种子数据填充完成！');
  console.log(`📧 管理员邮箱: ${email}`);
  console.log(`🔑 管理员密码: ${password}`);
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

