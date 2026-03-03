import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function paged<T>(
  data: T,
  meta: { total: number; page: number; pageSize: number },
  init?: ResponseInit,
) {
  return NextResponse.json({ data, ...meta }, init);
}

export function badRequest(details?: unknown, error: string = 'Invalid request') {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status: 400 });
}

export function notFound(error: string = 'Resource not found') {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error: string = 'Resource already exists') {
  return NextResponse.json({ error }, { status: 409 });
}

export function tooManyRequests(error: string = 'Too many requests') {
  return NextResponse.json({ error }, { status: 429 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function serverError(context: string, error: unknown) {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
