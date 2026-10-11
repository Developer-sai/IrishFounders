import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadFounder(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("public_founders").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const f = await loadFounder(id);
  return { title: f?.full_name ?? "Founder not found" };
}

export default async function FounderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const founder = await loadFounder(id);
  if (!founder) notFound();

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("startup_members")
    .select("role_title, startups!inner(name, slug, is_verified)")
    .eq("profile_id", id)
    .eq("startups.is_verified", true);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-12">
      <header className="flex items-center gap-4">
        <Avatar name={founder.full_name} src={founder.avatar_url} size={72} />
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {founder.full_name}
            <BadgeCheck className="h-5 w-5 text-accent" aria-label="Verified founder: approved membership" />
          </h1>
          <p className="text-muted-foreground">{founder.headline}</p>
          {founder.location ? <p className="text-sm text-muted-foreground">{founder.location}</p> : null}
        </div>
      </header>

      {founder.bio ? (
        <Card><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent className="text-sm">{founder.bio}</CardContent></Card>
      ) : null}

      {memberships && memberships.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Startups</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {memberships.map((m, i) => {
                const s = Array.isArray(m.startups) ? m.startups[0] : m.startups;
                return s ? (
                  <li key={i}>
                    <Link href={`/startups/${s.slug}`} className="font-medium underline">{s.name}</Link>{" "}
                    <span className="text-muted-foreground">· {m.role_title}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {founder.skills && founder.skills.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {founder.skills.map((s) => <Badge key={s}>{s}</Badge>)}
          </CardContent>
        </Card>
      ) : null}

      {founder.linkedin_url ? (
        <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm underline">
          <ExternalLink className="h-4 w-4" aria-hidden /> LinkedIn
        </a>
      ) : null}
    </div>
  );
}
