// ─── 站点配置 ───
export function getSiteConfig() {
  return {
    name: process.env.SITE_NAME || 'Way',
    description: process.env.SITE_DESCRIPTION || 'A Journey of Code and Thought',
    url: process.env.SITE_URL || 'http://localhost:3333',
  };
}
