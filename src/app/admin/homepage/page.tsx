import { redirect } from 'next/navigation';

export default function AdminHomepagePage() {
  redirect('/admin/settings');
}
