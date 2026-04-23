export default function AdminPagesPage() {
  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-neutral-800 mb-2">Static Pages</h2>
      <p className="text-sm text-neutral-500">
        No static pages table exists yet. Add a <code className="text-xs font-mono bg-neutral-100 px-1 py-0.5 rounded">static_pages</code> table
        to the database if you need to manage page content (About, Privacy, Terms, etc.) from the admin.
      </p>
    </div>
  );
}
