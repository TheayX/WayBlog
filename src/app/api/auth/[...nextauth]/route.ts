import { handlers } from '@/lib/auth';

/**
 * NextAuth 路由处理器。
 *
 * 这里直接复用认证模块导出的 GET/POST 处理器，对外承接登录、回调、会话读取等协议端点。
 * 该路由属于认证基础设施层，具体鉴权策略、Provider 配置、请求体验证与会话序列化逻辑统一收敛在 `lib/auth`，
 * 因此这里既不重复实现登录校验，也不额外包装返回体，所有响应语义都遵循 NextAuth 协议本身。
 * 该入口本身就是认证能力的一部分，而不是“先鉴权再访问”的业务接口，因此不会再叠加管理后台式的 requireAuth 保护。
 * 登录限流和失败审计位于 credentials provider 的 `authorize` 中，保证 NextAuth 协议响应结构保持一致。
 */
export const { GET, POST } = handlers;
