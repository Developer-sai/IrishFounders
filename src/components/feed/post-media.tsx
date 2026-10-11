/** Instagram-style media layout for up to four images. */
export function PostMedia({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  const shown = urls.slice(0, 4);
  const layout = shown.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={`-mx-5 grid gap-0.5 sm:mx-0 ${layout}`}>
      {shown.map((u, i) => (
        <a
          key={u}
          href={u}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open image ${i + 1} of ${shown.length}`}
          className={`block overflow-hidden bg-muted ${shown.length === 1 ? "aspect-[4/3]" : shown.length === 3 && i === 0 ? "row-span-2 aspect-auto" : "aspect-square"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
        </a>
      ))}
    </div>
  );
}
