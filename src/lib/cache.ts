/** 公开页面数据缓存时间，兼顾发布后的可见性和数据库压力。 */
export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;

/** 公开元数据缓存时间，RSS 和 sitemap 对实时性要求较低。 */
export const PUBLIC_METADATA_REVALIDATE_SECONDS = 3600;
