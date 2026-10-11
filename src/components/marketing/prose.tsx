export function Prose({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {updated ? <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p> : null}
      <div className="mt-8 space-y-4 text-sm leading-7 text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </article>
  );
}
