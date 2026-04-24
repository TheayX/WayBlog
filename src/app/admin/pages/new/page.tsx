import { PageForm } from '@/components/admin/PageForm';
import { PageIntro } from '@/components/ui/PageIntro';

/**
 * 管理后台新建单页页。
 *
 * 单页编辑保持最小工作台形态，只处理标题、slug 和正文；
 * 当前主要服务 about 这类固定入口，不引入文章级别的复杂元数据。
 */
export default function NewAdminPagePage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pages"
        title="新建单页"
        description="单页适合承载关于、说明、项目介绍等低频更新内容。先确定稳定 slug，再维护正文会更稳妥。"
      />

      <PageForm />
    </div>
  );
}
