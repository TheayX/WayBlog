import { notFound } from 'next/navigation';
import { PostForm } from '@/components/admin/PostForm';
import { getAdminPostEditorData } from '@/lib/posts/queries';

/**
 * 管理后台文章编辑页。
 *
 * 直接在服务端读取受保护的后台编辑数据，再回填到统一表单中；
 * 这样可以避免先渲染空壳页面、再从客户端请求后台详情，也不会再依赖一个暴露面过宽的读取接口。
 */
interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postData = await getAdminPostEditorData(id);

  if (!postData) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">编辑文章</h1>
      <PostForm initialData={postData} isEdit />
    </div>
  );
}

