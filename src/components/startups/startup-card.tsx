import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

export type StartupCardData = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string;
  stage: string;
  short_description: string;
  location: string | null;
};

export function StartupCard({ startup }: { startup: StartupCardData }) {
  return (
    <Link href={`/startups/${startup.slug}`} className="block rounded-lg focus-visible:ring-2">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {startup.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={startup.logo_url} alt="" className="h-10 w-10 rounded-md object-cover" />
            ) : (
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-md bg-muted font-semibold">
                {startup.name[0]}
              </span>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate font-semibold">
                {startup.name}
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-label="Verified startup" />
              </p>
              <p className="truncate text-xs text-muted-foreground">{startup.location ?? "Ireland"}</p>
            </div>
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{startup.short_description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge>{startup.industry}</Badge>
            <Badge>{humanize(startup.stage)}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
