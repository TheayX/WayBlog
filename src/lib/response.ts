/**
 * 路由处理器通用响应工厂。
 *
 * 目标是统一 JSON 响应结构与常见 HTTP 状态码表达，减少各路由处理器重复拼装响应对象。
 * 这些函数只做轻量封装，不引入业务语义，便于在前台页面和管理后台接口中复用。
 */
import { NextResponse } from 'next/server';

/** 生成 `{ data }` 结构的成功响应。 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

/**
 * 生成带分页元数据的成功响应。
 * 约定将分页字段平铺到顶层，便于前端列表页直接消费。
 */
export function paged<T>(
  data: T,
  meta: { total: number; page: number; pageSize: number },
  init?: ResponseInit,
) {
  return NextResponse.json({ data, ...meta }, init);
}

/**
 * 生成 400 响应。
 * `details` 通常用于携带校验失败后的结构化错误信息。
 */
export function badRequest(details?: unknown, error: string = 'Invalid request') {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status: 400 });
}

/** 生成 401 响应，适用于登录会话缺失或失效场景。 */
export function unauthorized(error: string = 'Unauthorized') {
  return NextResponse.json({ error }, { status: 401 });
}

/** 生成 404 响应，适用于资源不存在场景。 */
export function notFound(error: string = 'Resource not found') {
  return NextResponse.json({ error }, { status: 404 });
}

/** 生成 409 响应，适用于唯一约束或状态冲突场景。 */
export function conflict(error: string = 'Resource already exists') {
  return NextResponse.json({ error }, { status: 409 });
}

/** 生成 413 响应，适用于上传文件超出服务端限制的场景。 */
export function payloadTooLarge(error: string = 'Payload too large') {
  return NextResponse.json({ error }, { status: 413 });
}

/** 生成 429 响应，通常与限流模块配合使用。 */
export function tooManyRequests(error: string = 'Too many requests') {
  return NextResponse.json({ error }, { status: 429 });
}

/**
 * 生成 204 空响应。
 * 常用于删除操作或无需返回主体的更新操作。
 */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * 记录服务端错误并返回统一 500 响应。
 * `context` 用于日志归类，便于后续排查具体出错的路由处理器或业务步骤。
 */
export function serverError(context: string, error: unknown) {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
