"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { markStoryViewed } from "@/lib/actions/social";
import { StoryRing } from "@/components/ui/story-ring";

export type StoryItem = { id: string; kind: string; text: string | null; media_url: string | null; created_at: string; seen: boolean };
export type StoryGroup = {
  authorId: string;
  name: string;
  avatar: string | null;
  handle: string | null;
  isMe: boolean;
  stories: StoryItem[];
};

const KIND: Record<string, string> = {
  update: "Update", milestone: "Milestone", hiring: "Hiring", looking_for: "Looking for", launch: "Launch",
};
const DURATION_MS = 5500;

function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`;
}

export function StoryTray({ groups, meName, meAvatar }: { groups: StoryGroup[]; meName: string; meAvatar: string | null }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [gi, setGi] = useState(0);
  const [si, setSi] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [opened, setOpened] = useState(false);
  const mine = groups.find((g) => g.isMe);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const group = groups[gi];
  const story = group?.stories[si];

  // record the view whenever a story is shown (opened flag: indices may not change on first open)
  const storyId = story?.id;
  const isMe = group?.isMe;
  useEffect(() => {
    if (opened && storyId && !isMe) void markStoryViewed(storyId);
  }, [opened, storyId, isMe]);

  const open = (index: number) => {
    setGi(index);
    const first = groups[index]?.stories.findIndex((s) => !s.seen) ?? 0;
    setSi(first < 0 ? 0 : first);
    setPaused(false);
    setOpened(true);
    dialog.current?.showModal();
  };
  const close = useCallback(() => {
    dialog.current?.close();
    router.refresh();
  }, [router]);

  const next = useCallback(() => {
    const g = groups[gi];
    if (!g) return;
    if (si < g.stories.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else close();
  }, [groups, gi, si, close]);

  const prev = useCallback(() => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      const pg = groups[gi - 1]!;
      setGi(gi - 1);
      setSi(pg.stories.length - 1);
    }
  }, [groups, gi, si]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === " ") {
      e.preventDefault();
      setPaused((p) => !p);
    }
  }

  return (
    <section aria-label="Stories" className="mb-8">
      <ul className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        <li className="shrink-0">
          {mine ? (
            <button type="button" onClick={() => open(groups.indexOf(mine))} className="flex w-[72px] flex-col items-center gap-1.5">
              <StoryRing name={meName} src={meAvatar} size={60} state={mine.stories.every((s) => s.seen) ? "seen" : "unseen"} />
              <span className="w-full truncate text-center text-[11px]">Your story</span>
            </button>
          ) : (
            <Link href="/stories/new" className="flex w-[72px] flex-col items-center gap-1.5" aria-label="Add a story">
              <span className="relative inline-flex">
                <StoryRing name={meName} src={meAvatar} size={60} />
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent text-white">
                  <Plus className="h-3 w-3" aria-hidden />
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px]">Add story</span>
            </Link>
          )}
        </li>
        {groups.filter((g) => !g.isMe).map((g) => {
          const unseen = g.stories.some((s) => !s.seen);
          return (
            <li key={g.authorId} className="shrink-0">
              <button type="button" onClick={() => open(groups.indexOf(g))} className="flex w-[72px] flex-col items-center gap-1.5" aria-label={`${g.name}, ${unseen ? "new story" : "story seen"}`}>
                <StoryRing name={g.name} src={g.avatar} size={60} state={unseen ? "unseen" : "seen"} verified />
                <span className="w-full truncate text-center text-[11px]">{g.name.split(" ")[0]}</span>
              </button>
            </li>
          );
        })}
        {groups.filter((g) => !g.isMe).length === 0 ? (
          <li className="flex items-center self-center pl-2 text-sm text-muted-foreground">
            No stories from the community right now.
          </li>
        ) : null}
      </ul>

      <dialog
        ref={dialog}
        aria-label={group ? `Story by ${group.name}` : "Story"}
        onKeyDown={onKeyDown}
        onClose={() => {
          setPaused(false);
          setOpened(false);
        }}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-transparent p-0 backdrop:bg-black/90 md:m-auto md:h-[min(86vh,760px)] md:w-[min(440px,92vw)]"
      >
        {group && story ? (
          <div className="relative flex h-full flex-col overflow-hidden bg-sidebar text-[hsl(41_30%_93%)]">
            <div className="absolute inset-x-0 top-0 z-10 space-y-3 bg-gradient-to-b from-black/60 to-transparent p-3 pb-8">
              <div className="flex gap-1" aria-hidden>
                {group.stories.map((s, i) => (
                  <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                    <span
                      key={`${gi}-${si}-${i}`}
                      onAnimationEnd={i === si && !reduced ? next : undefined}
                      className={`block h-full origin-left bg-white ${i < si ? "scale-x-100" : i === si ? "" : "scale-x-0"}`}
                      style={i === si && !reduced ? { animation: `story-progress ${DURATION_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" } : i === si ? { transform: "scaleX(1)" } : undefined}
                    />
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/founders/${group.authorId}`} onClick={close} className="flex items-center gap-2.5 text-sm">
                  <StoryRing name={group.name} src={group.avatar} size={32} verified={!group.isMe} />
                  <span className="font-medium">{group.name}</span>
                  <span className="font-mono text-[11px] opacity-70">{ago(story.created_at)}</span>
                </Link>
                <button type="button" onClick={close} aria-label="Close story" className="rounded-sm p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="relative flex-1" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
              {story.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.media_url} alt="" className="absolute inset-0 h-full w-full object-contain" />
              ) : null}
              {story.text ? (
                <div className={`absolute inset-0 flex items-center justify-center p-8 ${story.media_url ? "items-end bg-gradient-to-t from-black/70 to-transparent pb-14" : ""}`}>
                  <p className={`display text-center ${story.media_url ? "text-2xl" : "text-4xl"}`}>{story.text}</p>
                </div>
              ) : null}
              <span className="absolute bottom-4 left-4 rounded-sm border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">{KIND[story.kind] ?? story.kind}</span>
              <button type="button" aria-label="Previous story" onClick={prev} className="absolute inset-y-16 left-0 w-1/3 focus-visible:ring-inset" />
              <button type="button" aria-label="Next story" onClick={next} className="absolute inset-y-16 right-0 w-2/3 focus-visible:ring-inset" />
            </div>
            <p className="sr-only" aria-live="polite">{`Story ${si + 1} of ${group.stories.length} by ${group.name}`}</p>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
