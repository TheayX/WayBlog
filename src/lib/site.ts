/**
 * 站点级基础配置读取入口。
 *
 * 这里统一从环境变量读取对外展示所需的站点信息，并提供本地开发默认值，
 * 避免公开页/前台页面和 SEO 相关代码散落读取 `process.env`。
 */
export function getSiteConfig() {
  return {
    name: process.env.SITE_NAME || 'Way',
    description: process.env.SITE_DESCRIPTION || 'A Journey of Code and Thought',
    url: process.env.SITE_URL || 'http://localhost:3610',
  };
}
