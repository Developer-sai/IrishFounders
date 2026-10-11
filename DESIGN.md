# Design System — Irish Founders

## Product Context
- **What this is:** A hand-verified, approval-only community for Irish founders, startups, investors and ecosystem partners.
- **Who it's for:** Founders who are tired of anonymous networks; investors who want to know who they are talking to.
- **Project type:** Marketing site + member workspace + admin review desk.
- **Memorable thing:** *A guest book you have to be vouched into.* Every surface should feel curated and checked by a person, never mass-produced.

## Aesthetic Direction
- **Direction:** Editorial / refined, a members' club ledger. Hairline rules, numbered entries, serif headlines, small-caps labels.
- **Decoration:** Minimal-intentional. Structure comes from rules and type, not boxes and shadows. No gradients, no blobs, no icon-in-circle grids.
- **Anti-slop:** No purple, no green-everywhere, no shamrocks. No centred-everything heroes. No shadowed card grids as the default container.

## Typography
- **Display:** Fraunces (variable serif; optical size + soft axis). Headlines, big numerals, pull quotes.
- **Body / UI:** Instrument Sans. Clean, slightly humanist, not Inter.
- **Data / labels:** JetBrains Mono, uppercase, tracked, tabular numerals. Eyebrows, stats, timestamps, status.
- **Scale:** 12 / 14 / 16 / 18 / 22 / 30 / 44 / 64 px. Display uses tight tracking (-0.02em), line-height 1.05.

## Color
Restrained: paper and ink carry the page; one action colour; one trust colour.
- **Paper (bg):** `#F5F1E8` limestone. **Card/paper-light:** `#FBF9F4`. **Muted:** `#EBE5D8`. **Hairline:** `#D6CEBE`.
- **Ink (fg/primary):** `#12161D`. **Muted ink:** `#5A5F68`.
- **Door vermilion (action / accent):** `#C2412A`, a Georgian-door red. Buttons, links on hover, unread dots. Used rarely so it means "do this".
- **Bog green (verified):** `#1F5A43`. Reserved **only** for verified/approved/success. Never decorative.
- **Dark mode:** ink background `#10141A`, paper text, vermilion lifted to `#E2634C`, green to `#4FAE88`.

## Spacing & Layout
- **Base:** 4px; generous vertical rhythm on marketing (96-128px sections), dense and calm in the app.
- **Max width:** 1120px marketing; app content 1040px.
- **Radius:** 2px (inputs, buttons, panels) / 999px only for tiny status pills. No bubbly radii.
- **Containers:** hairline-bordered panels, no shadows. Lists are ruled rows, not cards.

## Components
- **Seal:** a circular stamp (mono caps around a check) marks verified entities. It is the brand device.
- **Eyebrow:** mono 11px uppercase tracking .14em, muted.
- **Ledger row:** number or label left, content middle, status right, 1px rule below.
- **App shell:** ink sidebar, paper content.

## Motion
Minimal-functional: 120ms colour/opacity transitions, focus ring 2px vermilion offset 2px. Respect `prefers-reduced-motion`.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-11 | Fraunces + Instrument Sans + JetBrains Mono | Distinctive serif for trust and character; avoids the Inter/system-ui default look |
| 2026-10-11 | Vermilion action, green reserved for verified | Colour carries meaning; verification is the product |
| 2026-10-11 | Hairlines over shadows/cards | Reads as a ledger, not a SaaS template |

## v2: Verified Social layer (Instagram x LinkedIn x founder discovery)
- **Principle:** verification is the visual brand. Every avatar that appears with a story ring or profile carries the green seal.
- **Story ring:** 2px vermilion ring + paper gap = unseen, hairline = seen. 24h stories, 280 chars or one image, 10/day.
- **Profile:** fanlight-pattern cover (or upload), avatar + seal, "Looking for" (vermilion chips) vs "Can offer" (green chips), milestone timeline, 3-column Activity grid (image / serif text tile / ink launch tile).
- **Feed:** For you / Following / Startups tabs, media-first cards, optimistic likes, composer collapses to one line on mobile.
- **Discover:** one match at a time, always with "Why you match" reasons (rule-based, explainable). Pass / Follow / Connect.
- **Launch Day:** ink "Launch of the day" hero, ranked rows with large serif numerals, score = (votes+1)/(age_h+2)^1.5.
- **Navigation:** desktop ink sidebar + top bar (Cmd/Ctrl-K search, theme toggle); mobile bottom tab bar with a central create sheet.
- **Theme:** light/dark via `data-theme` with OS default; saved in localStorage; applied before paint.
- **Gradients:** none, except a functional black scrim behind text on story media.

### Engineering decisions
- **Do not add route-level `loading.tsx` to pages that contain server-action forms.** In production builds it prevented the page
  from re-rendering after an action (post stayed "Working..."); found by the browser E2E and verified by removing the file.
- Direct inserts into `stories` are blocked; `create_story` enforces media ownership, startup membership and the daily cap.
- Team rows for other people are read via the `public_startup_team` view; members cannot read `startup_members` directly.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-11 | Evolve Guest Book rather than restyle | Keeps the verified, editorial identity that differentiates from Instagram/LinkedIn clones |
| 2026-10-11 | Explainable rule-based matching | Trust is the product; users can see and challenge why a match was suggested |
