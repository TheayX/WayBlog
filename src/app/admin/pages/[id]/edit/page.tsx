import { notFound } from 'next/navigation';
import { PageForm } from '@/components/admin/PageForm';
import { PageIntro } from '@/components/ui/PageIntro';
import { getAdminPageEditorData } from '@/lib/pages/admin-service';

interface EditAdminPagePageProps {
  params: Promise<{ id: string }>;
}

/**
 * 管理后台编辑单页页。
 *
 * 直接在服务端读取单页编辑数据后回填统一表单，
 * 避免客户端先渲染空壳再额外请求一次后台详情接口。
 */
export default async function EditAdminPagePage({ params }: EditAdminPagePageProps) {
  const { id } = await params;
  const page = await getAdminPageEditorData(id);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pages"
        title="编辑单页"
        description="编辑模式与新建页保持同一结构，但会直接回填现有标题、slug 和正文，方便长期维护固定内容。"
      />

      <PageForm initialData={page} isEdit />
    </div>
  );
}
