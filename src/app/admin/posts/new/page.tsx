import { PostForm } from '@/components/admin/PostForm';

/**
 * 管理后台新建文章页。
 *
 * 只负责挂载空白表单，让编辑逻辑统一复用 PostForm，
 * 避免新建与编辑场景各自维护一套字段状态。
 */
export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">新建文章</h1>
      <PostForm />
    </div>
  );
}

