"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", bio: "", is_public: true });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) setForm({ full_name: p.full_name ?? "", phone: (p as any).phone ?? "", city: (p as any).city ?? "", bio: (p as any).bio ?? "", is_public: (p as any).is_public !== false });
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.from("profiles").update({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        is_public: form.is_public,
        updated_at: new Date().toISOString(),
      } as any).eq("id", userId!);
      if (err) { setError(err.message); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></main>;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <Link href={userId ? `/profile/${userId}` : "/dashboard"} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />Back to profile
        </Link>
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">Update your public-facing information on Trade Source.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={form.full_name} onChange={e => { setForm(p => ({...p, full_name: e.target.value})); setSaved(false); }} placeholder="Your name" className="border-neutral-200" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City / Area</Label>
            <Input id="city" name="city" value={form.city} onChange={e => { setForm(p => ({...p, city: e.target.value})); setSaved(false); }} placeholder="e.g. Santa Rosa Beach, 30A" className="border-neutral-200" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone <span className="text-neutral-400 font-normal">(private)</span></Label>
            <Input id="phone" name="phone" type="tel" value={form.phone} onChange={e => { setForm(p => ({...p, phone: e.target.value})); setSaved(false); }} placeholder="(850) 555-0000" className="border-neutral-200" />
            <p className="text-xs text-neutral-400">Only visible to you.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" value={form.bio} onChange={e => { setForm(p => ({...p, bio: e.target.value})); setSaved(false); }} placeholder="A short note about yourself…" rows={4} className="resize-none border-neutral-200" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Public profile</p>
              <p className="text-xs text-neutral-500">When off, only you can see your profile.</p>
            </div>
            <Switch checked={form.is_public} onCheckedChange={v => { setForm(p => ({...p, is_public: v})); setSaved(false); }} />
          </div>
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="bg-neutral-900 hover:bg-neutral-800">
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" />Saved</span>}
            <Link href={userId ? `/profile/${userId}` : "/dashboard"} className="ml-auto text-sm text-neutral-500 hover:text-neutral-900">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
