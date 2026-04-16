'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostForm } from '@/components/admin/PostForm';

/**
 * 管理后台文章编辑页。
 *
 * 先按 id 拉取现有文章详情，再把数据回填到统一表单中；
 * 如果文章不存在，则在页面层直接给出错误提示而不是进入空白编辑状态。
 */
export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [postData, setPostData] = useState<null | {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    status: 'DRAFT' | 'PUBLISHED';
    pinned: boolean;
    categoryId: string;
    tagIds: string[];
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((res) => {
        const post = res.data;
        setPostData({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || '',
          coverImage: post.coverImage || '',
          status: post.status,
          pinned: post.pinned,
          categoryId: post.categoryId || '',
          tagIds: post.tags?.map((t: { id: string }) => t.id) || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted-foreground">加载中...</p>;
  if (!postData) return <p className="text-destructive">文章不存在</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">编辑文章</h1>
      <PostForm initialData={postData} isEdit />
    </div>
  );
}

