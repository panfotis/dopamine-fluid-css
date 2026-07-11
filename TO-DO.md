# TO-DO — Dopamine Fluid

The 2026-07-11 consistency-audit backlog shipped in **0.9.0** (one commit each —
see `git log`): breakpoint unification, z as a numeric prefix, position offsets,
`ratio-16/9`, the keyword batch, `colspan` / `cols-1:3` aliases, container rem,
and the ls-as-percent doc reframe.

## Backlog (ideas, not scheduled)

- `dopamine explain <class>` command — "what CSS does this emit?" without a build. Reuses `parseClass` / `generateRule` / `diagnoseClass`; thin bin wrapper.
- `opacity` prefix, literal decimal like `lh`: `opacity-0.5` → `opacity: 0.5` (`unitless`, `fixedOnly`, `allowsDecimal`). NOT divisor-100 — settled 2026-07-11.
- `flex-1` / `flex-auto` / `flex-none` keywords — the `flex` shorthand people actually reach for; `grow`/`shrink` cover the granular cases.
- `text-balance` / `text-nowrap` keywords.
