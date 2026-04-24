import { PostEditorPageShell } from '@/components/admin/PostEditorPageShell';
import { PostForm } from '@/components/admin/PostForm';

/**
 * 管理后台新建文章页。
 *
 * 只负责挂载空白表单，让编辑逻辑统一复用 PostForm，
 * 避免新建与编辑场景各自维护一套字段状态。
 */
export default function NewPostPage() {
  return (
    <PostEditorPageShell
      title="新建文章"
      description="编辑页将标题、正文、摘要、封面、分类与 AI 辅助统一收进一套创作工作台，不再是简单字段堆叠。"
    >
      <PostForm showToolbar={false} toolbarPortalTargetId="post-ai-toolbar-slot" />
    </PostEditorPageShell>
  );
}
