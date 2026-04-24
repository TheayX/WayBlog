/**
 * 站点公开资料配置。
 *
 * 这里存放会直接展示给访客的品牌、描述和联系方式；
 * 这些信息不属于敏感配置，也不需要随部署环境切换，因此不放进 env。
 */
export const SITE_PROFILE = {
  brandName: 'WayBlog',
  shortBrandName: 'Way.',
  contactEmail: 'way20031208@gmail.com',
  githubUrl: 'https://github.com/wayblog',
  githubLabel: 'GitHub',
  homeEyebrow: 'Independent Notes',
  homeHeadline: '记录开发实践，也把复杂问题写成能被反复阅读的文字。',
  homeDescription:
    '以技术写作和长期积累为主，不追求信息噪声，更强调可回看、可复用、可沉淀的内容结构。',
  footerHeadline: '写代码，写文章，也写清楚自己在想什么。',
  footerDescription: '这是一个偏内容优先的技术博客，记录开发实践、工程思考和持续整理后的经验。',
} as const;
