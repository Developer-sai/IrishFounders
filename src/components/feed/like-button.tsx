"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "@/lib/actions/social";

/** Optimistic like: the UI updates instantly and the server action reconciles. */
export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [state, flip] = useOptimistic({ liked, count }, (s) => ({
    liked: !s.liked,
    count: s.count + (s.liked ? -1 : 1),
  }));
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={state.liked ? `Unlike, ${state.count} likes` : `Like, ${state.count} likes`}
      onClick={() =>
        start(async () => {
          flip(true);
          await toggleReaction(postId);
        })
      }
      className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[13px] transition-colors hover:bg-muted ${state.liked ? "text-accent" : "text-foreground/70"}`}
    >
      <Heart className="h-4 w-4" fill={state.liked ? "currentColor" : "none"} aria-hidden />
      <span className="tabular">{state.count}</span>
    </button>
  );
}
