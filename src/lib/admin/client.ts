type AdminFetchResult<TResult> =
  | { ok: true; status: number; data: TResult }
  | { ok: false; status: number; error: string };

/**
 * 获取后台列表接口的 JSON 结果。
 *
 * 后台列表页大多约定返回 `{ data, ...meta }` 结构；
 * 这里同时保留 HTTP 成功/失败状态，避免 401、500 或协议错误被页面误当成空列表。
 */
export async function fetchAdminCollection<TResult>(endpoint: string) {
  const response = await fetch(endpoint);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: result?.error || '加载失败',
    } satisfies AdminFetchResult<TResult>;
  }

  return {
    ok: true as const,
    status: response.status,
    data: result as TResult,
  } satisfies AdminFetchResult<TResult>;
}

/**
 * 后台资源写操作的客户端辅助函数。
 *
 * 这里只封装“根据是否编辑态自动选择 POST/PUT”和“统一解析错误响应”这类重复模板，
 * 页面自身仍然负责字段校验、成功提示和编辑态切换。
 */
export async function saveAdminResource<TPayload>({
  endpoint,
  editingId,
  body,
}: {
  endpoint: string;
  editingId: string | null;
  body: TPayload;
}) {
  const url = editingId ? `${endpoint}/${editingId}` : endpoint;
  const method = editingId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return {
      ok: true as const,
      data: await response.json().catch(() => null),
    };
  }

  const error = await response.json().catch(() => null);

  return {
    ok: false as const,
    error: error?.error || '保存失败',
  };
}

/**
 * 后台资源删除的客户端辅助函数。
 *
 * 删除接口普遍返回 204，因此这里只关心是否成功，不要求页面再重复拼接删除 URL。
 */
export async function deleteAdminResource(endpoint: string, id: string) {
  const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
  return response.ok;
}
