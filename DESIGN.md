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
