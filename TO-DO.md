# TO-DO — Dopamine Fluid

Tasks 1–7 from the 2026-07-06 code review are done and shipped in **0.8.0**
(one commit each — see `git log`). What remains is the unscheduled backlog.

## Backlog

Suggested order: breakpoint unification FIRST (z depends on it), then the rest in any
order. Batch the two breaking items (`z-*` breakpoint flip, `container` px→rem) into one
**0.9.0** release with a migration note in the README changelog (same pattern as 0.8.0).
Follow the CLAUDE.md checklists per item — one commit each, golden refresh in the same
commit, README tables updated manually.

- Position offsets: PREFIX_MAP entries (fluid + negative capable) — biggest gap; `absolute`/`fixed` ship without any offset utilities. Logical, matching `ps`/`pe`: `top` → `top`, `bottom` → `bottom`, `start` → `inset-inline-start`, `end` → `inset-inline-end`, `inset` → `inset`. Plus an `inset-0` keyword for the overlay case (90% of real usage).
- `aspect-ratio` via slash notation: `ratio-16/9` → `aspect-ratio: 16 / 9`. Slash, not dots — `ratio-16.9` reads as a plausible decimal (cinema `1.85`), and the slash is the literal CSS value; leaves room for decimal support later. `escapeSelector` already handles `/`.
- Unify breakpoint position — **do first, others depend on it**: numeric classes use the middle (`fs-md-24`) but keywords use the end (`flex-md`). Sharpest collision is `fw`, which lives in both systems: `fw-md-700` vs `fw-bold-md`. Fix: keywords also accept the middle position (`text-md-center`); end position keeps working. Numeric can't move (trailing slot is the value), so middle is the only universal position.
- Replace the 9 hardcoded `z-*` keyword entries with a unitless `z` PREFIX_MAP entry (like `order`, `allowsNegative`). NOTE: flips the breakpoint form `z-10-md` → `z-md-10` (breaking) — painless if breakpoint unification ships first.
- Keywords: `object-cover`/`object-contain`, `truncate`, `sr-only`, `fw-semibold`, logical `text-start`/`text-end` (emit `text-align: start/end` — primary fix for the physical `text-left`/`text-right` contradicting the library's logical direction; keep left/right as legacy). NOTE: `truncate` (overflow + text-overflow + white-space) and `sr-only` (~6 declarations) are multi-declaration — KEYWORD_MAP entries are single prop/value today, so the map shape and both generators need a `declarations` form first.
- `colspan` alias for `span` (one PREFIX_MAP line) — `span-3` means *column* span but doesn't say so, while `rowspan-3` is explicit. Document `span` as the shorthand. No `rows-N` — grid rows are usually implicit.
- Test gap: `golden.html` has no fluid width range (`w-100-400` style) — only `cli.test.js` covers it, but the golden is supposed to be the executable syntax reference. Add one + `UPDATE_GOLDEN=1 npm test`.
- `container-N`: convert output to rem (`container-900` → `max-width: 56.25rem`) so "numbers are px→rem" has zero exceptions. Breaking for output, same computed size. Breakpoint variants NOT needed — containers are already responsive via `width: 100%` + max-width.
- `cols` colon alias: accept `cols-1:3` alongside `cols-1.3` (both → `1fr 3fr`). Colon reads as ratio notation; `escapeSelector` handles `:`. Keep dots working.
- Docs: reframe `ls` as **percent of font size** (`ls-5` = 5% tracking = `0.05em`) in README + CLAUDE.md. No code change — the divisor-100 stops reading as arbitrary once it's called a percent. State the number rule in one place: length-ish numbers are px→rem, unitless CSS values are literal (`lh`), `ls` is percent.