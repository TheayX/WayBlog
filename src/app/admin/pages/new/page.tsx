import { PageForm } from '@/components/admin/PageForm';
import { PageIntro } from '@/components/ui/PageIntro';

/**
 * 管理后台新建单页页。
 *
 * 单页编辑保持轻量工作台形态，但会额外维护一个排序值，
 * 让后台创建完成后即可直接影响前台“页面”下拉中的显示顺序。
 */
export default function NewAdminPagePage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pages"
        title="新建单页"
        description="单页适合承载关于、简历、说明、项目介绍等低频更新内容。先确定稳定 slug，再设置导航排序会更稳妥。"
      />

      <PageForm />
    </div>
  );
}
