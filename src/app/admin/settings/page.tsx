import { createAdminClient } from '@/lib/supabase/admin';
import { SettingsEditor } from './settings-editor';

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Settings / Feature Flags</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Key–value store. Values can be strings, numbers, booleans, or JSON objects.
        </p>
      </div>
      <SettingsEditor settings={data ?? []} />
    </div>
  );
}
