import { saveAdminResource } from '@/lib/admin/client';

export interface SavePostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  pinned: boolean;
  categoryId: string | null;
  tagIds: string[];
}

/**
 * 保存文章。
 *
 * 编辑页与新建页都复用 `/api/admin/posts` 的同一套后台写接口；
 * 抽到客户端辅助层后，PostForm 只需要关心表单归一化，不再自己拼装请求模板。
 */
export async function savePost(editingId: string | null, body: SavePostPayload) {
  return saveAdminResource({
    endpoint: '/api/admin/posts',
    editingId,
    body,
  });
}

/**
 * 上传文章插图。
 *
 * 上传接口返回 `{ data: { url } }` 结构，这里只向表单暴露真正需要的 URL，
 * 避免上传协议细节继续散落在组件内部。
 */
export async function uploadPostImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    return {
      ok: false as const,
    };
  }

  const result = (await response.json()) as { data?: { url?: string } };

  return {
    ok: true as const,
    url: result.data?.url || '',
  };
}
