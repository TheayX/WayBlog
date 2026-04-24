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
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
        <div className="rounded-[1.75rem] border border-border bg-background px-6 py-6">
          <p className="eyebrow">Editor</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">编辑文章</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            编辑模式保留与新建页一致的工作台结构，但会直接回填现有数据，便于快速修订和再发布。
          </p>
        </div>
      </section>

      <PostForm initialData={postData} isEdit />
    </div>
  );
}
