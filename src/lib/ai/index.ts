/**
 * AI 服务公开导出入口。
 *
 * 供路由处理器或管理后台调用统一的字段优化、全文优化能力，
 * 避免上层直接依赖更底层的 prompt、provider 或归一化实现细节。
 */
export { optimizeFieldWithAi, optimizePostWithAi } from '@/lib/ai/service';
