import { redirect } from 'next/navigation';

/**
 * 管理后台根入口。
 *
 * 该页不单独渲染内容，而是统一把 `/admin` 重定向到仪表盘，
 * 避免后台出现多个等价首页入口。
 */
export default function AdminPage() {
  redirect('/admin/dashboard');
}

