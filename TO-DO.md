# TO-DO — Dopamine Fluid

Tasks 1–7 from the 2026-07-06 code review are done and shipped in **0.8.0**
(one commit each — see `git log`). What remains is the unscheduled backlog.

## Backlog (ideas, not scheduled)

- Position offsets: `top`/`bottom`/`start`/`end`/`inset` as PREFIX_MAP entries (fluid + negative capable) — biggest gap; `absolute`/`fixed` ship without any offset utilities.
- `aspect-ratio` via existing dot notation: `ratio-16.9` → `aspect-ratio: 16 / 9`.
- `@layer dopamine` wrapper option so user CSS overrides utilities without specificity fights.
- Replace the 9 hardcoded `z-*` keyword entries with a unitless `z` PREFIX_MAP entry (like `order`).
- Keywords: `object-cover`/`object-contain`, `truncate`, `sr-only`, `fw-semibold`, logical `text-start`/`text-end`.
- Unify breakpoint position: numeric classes use `fs-md-24` (middle) but keywords use `flex-md` (end) — consider accepting both for keywords.
- `container-N`: emits px (everything else is rem) and lacks breakpoint variants (known gap).
- Container-query fluid mode (`cqw` instead of `vw`) as a differentiator, opt-in.
