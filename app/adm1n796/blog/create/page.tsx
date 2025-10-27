import { AdminLayout } from '@/components/admin/AdminLayout';
import BlogEditor from '@/components/BlogEditor';

export default function AdminCreateBlogPostPage() {
  return (
    <AdminLayout>
      <BlogEditor mode="create" />
    </AdminLayout>
  );
}
