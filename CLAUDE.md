# Dopamine Fluid — maintainer context

A Node CLI that scans HTML/Twig templates for utility-style class names and generates a fluid CSS stylesheet — `clamp()`-based for fluid ranges, rem-converted for fixed values. Three binaries: `dopamine` (compiler), `dopamine-audit` (analyzes near-duplicate ranges), `dopamine-update` (version hint). Ships an SCSS addon with a standalone `fluid()` function. Zero runtime — all work is compile-time.

This file is for **library maintainers** (human or AI) making changes. User-facing syntax lives in [README.md](README.md).

## Architecture map

| File | Responsibility |
|---|---|
| `bin/dopamine.js` | CLI entry, commander parsing, delegates to runner |
| `bin/dopamine-audit.js` | Analyzer binary — suggests near-duplicate range merges (tunable via `--close-min`, `--close-max`) |
| `bin/dopamine-update.js` | Prints update-check message |
| `lib/runner.js` | Orchestrator: scan → extract → parse → generate → write (+ optional manifest + Sass functions file) |
| `lib/scanner.js` | `resolveFiles` (file / dir / glob) + `readFile` — uses the `glob` dep |
| `lib/parser.js` | `extractClasses` (attribute-only regex, returns Set), `extractClassCounts` (same regex, returns Map<name, count>), `parseClass` → descriptor, `diagnoseClass` (explain-why-it-failed), `resolveViewport` (fluid clamp range) |
| `lib/counter.js` | `collectClassCounts(filePaths)` — loops files, sums `extractClassCounts` into one Map. Used by `bin/dopamine-audit.js`. |
| `lib/config.js` | `loadConfig` (with defaults merge) + `PREFIX_MAP` — the canonical prefix→CSS table (load-bearing) |
| `lib/generator.js` | Descriptor → CSS rule string: `buildClamp`, `generateRule`, selector escaping |
| `lib/grid-parser.js` | `parseGridClass` for keyword / container / cols classes + `KEYWORD_MAP` |
| `lib/grid-generator.js` | Keyword / container / cols rule emission |
| `lib/sass-generator.js` | Auto-generates `_dopamine-functions.scss` alongside `.scss` output, parameterized by the user's config |
| `lib/cli-options.js` | Merges config-file hints with CLI args (`applyConfigHints`) — single spot to edit when adding a flag with a config alias |
| `lib/manifest.js` | Optional `--manifest <path>` JSON output — v2 schema: `{ version: 2, generated, classes: [{ name, count }] }` where `count` is occurrences across scanned templates (safelist-only classes get `count: 0`) |
| `lib/init.js` | `scaffoldProject` for `dopamine init` (copies `starter/`) |
| `lib/update-message.js` | Builds the message for `dopamine-update` |

## Compile pipeline

```
CLI (bin/dopamine.js)
  → applyConfigHints (cli-options.js)    merges CLI flags with dopamine.config.json
  → resolveFiles (scanner.js)             finds templates
  → extractClasses (parser.js)            pulls classes from class="..." attributes ONLY
  → parseClass (parser.js) → descriptor  |  parseGridClass (grid-parser.js) → grid descriptor
  → generateRule (generator.js) / generateGridRule (grid-generator.js) → CSS strings
  → runner.js buffers rules, groups by breakpoint, writes output + optional manifest + functions file
```

When you need to change behavior, map it to this flow first — the right file is usually obvious.

## Design conventions

Load-bearing rules. Do not break without a strong reason.

- **Numbers are pixels, converted to rem** (divided by 16). `fs-16` → `font-size: 1rem`.
- **Fluid ranges with `-min-max`**. `fs-16-48` → `clamp()` across the viewport. Supported by `fs`, `p(xytbse)`, `m(xytbse)`, `gap(xy)`, `w`, `maxw`, `minw`, `radius`. *Not* height prefixes, `lh`, `ls`, or `order` (all `fixedOnly`).
- **Inline viewport override with `--vpMin-vpMax`**. `fs-16-48--320-1440` overrides the default clamp range for that class. The `--` is literal.
- **Unit suffix `-N<unit>`** for sizing prefixes only (`w`, `h`, `maxw`, `minw`, `maxh`, `minh` — gated by `allowsUnits: true` in `PREFIX_MAP`). Units: `%`, `vw`, `vh`, `vmin`, `vmax`, `svw`, `svh`, `lvw`, `lvh`, `dvw`, `dvh`. No fluid mode for units (`w-50%-80%` is rejected — semantically muddy).
- **Breakpoint prefix `-sm-/-md-/-lg-/-xl-/-xxl-`** goes right after the prefix: `fs-md-24-48`. Wraps the rule in `@media (min-width: …)`. Breakpoint-prefixed fluid classes use the **global viewport** for clamp math (they are NOT re-scoped to the breakpoint's own range — deliberate decision; see `resolveViewport` in `lib/parser.js`).
- **Auto keyword** for margin (`m-auto`, `mx-auto`, `ms-auto`, etc.) and sizing (`w-auto`, `h-auto`), with breakpoint variants (`w-md-auto`). Matched by `AUTO_PATTERN` / `AUTO_BP_PATTERN` in `lib/parser.js` — the margin char class is `m[xytbse]?` (note: `s`/`e` for logical start/end, not the older `l`/`r`).
- **Logical inline properties** — `ps`/`pe`/`ms`/`me` emit `padding-inline-start/end`, `margin-inline-start/end`. `px`/`py`/`mx`/`my` still emit the two physical properties (symmetric — functionally identical to the logical shorthand, left as-is for backwards-looking readability).
- **Negative values via `n` prefix** (`mt-n10` → `-0.625rem`, `ls-n5` → `-0.05em`, `order-n1` → `-1`). Opt-in per prefix via `allowsNegative: true` in `PREFIX_MAP` — currently on all margin prefixes, `ls`, and `order`. Regex-level: value capture is `n?\d+`; parsed via `parseSignedInt` (normalizes `-0` → `0`). The `n` was chosen over `--` to avoid colliding with the `--vpMin-vpMax` inline viewport override.
- **Heights are `fixedOnly`** — `h`, `maxh`, `minh` reject fluid ranges. Reason: fluid clamp scales by viewport *width*, which misbehaves on portrait viewports. Use viewport units instead (`h-100dvh`, `minh-80svh`).
- **`ls` letter-spacing uses divisor 100 + unit='em'** — `ls-5` → `letter-spacing: 0.05em` (matches Tailwind tracking scale). `fixedOnly` by design — fluid letter-spacing mixes `em` and `vw` awkwardly.
- **`order` is unitless + `fixedOnly`** — `order-1` → `order: 1`. Supports negatives via `allowsNegative`.
- **`span` / `rowspan` (grid-child placement)** use `valuePrefix: 'span '` in `PREFIX_MAP` — generator prepends the keyword to the numeric output: `span-3` → `grid-column: span 3`. Any future prefix whose output needs a keyword+number shape can opt in the same way.
- **Scanning sources** — `extractClasses` reads from three places, in this order:
  1. Literal `class="..."` / `className="..."` attribute values (including ternaries like `class="{{ c ? 'fs-16' : 'fs-20' }}"` — both branches captured).
  2. Twig `{% set <var> = ... %}` RHS (array, ternary, or bare string). Gated by a cheap `content.includes('{%')` so HTML-only projects pay nothing.
  3. `addClass(...)` call arguments (any shape — `['a', 'b']`, `'a b'`, or multi-arg with ternaries). Gated by `content.includes('addClass(')`.

  All three pipe through `parseClass`, so tokens that aren't class-shaped (`{{`, `?`, translation strings, identifier references) are silently dropped before reaching CSS or manifest. Bare prose, `<code>` tags, comments, and JS expressions remain ignored. Dynamic concatenation like `'block-' ~ slug` extracts only the literal prefix (dropped by `parseClass`) — runtime-computed final names still go in `dopamine-safelist.txt`.
- **`cols-N` dot notation is a ratio list**: `cols-1.3` → `1fr 3fr`, `cols-1.2.1` → `1fr 2fr 1fr`. Dots ≠ decimals here.

## Adding features — quick checklists

**Add a new prefix:**
1. `lib/config.js` — add entry to `PREFIX_MAP`. Decide: `props`, `unitless`, `divisor`, `unit`, `valuePrefix`, `fixedOnly`, `allowsUnits`, `allowsNegative`.
2. Add a representative class to `test/fixtures/golden.html` (cover fixed + fluid + breakpoint + negative if applicable).
3. `UPDATE_GOLDEN=1 npm test`.
4. Update the Value Prefixes table in `README.md`.

**Enable negative values on an existing prefix:**
1. `lib/config.js` — add `allowsNegative: true` to the PREFIX_MAP entry.
2. Add a negative class (`prefix-nN`) to `test/fixtures/golden.html`.
3. `UPDATE_GOLDEN=1 npm test` and confirm the rejection tests in `cli.test.js` still pass (the "n-prefix: negatives rejected on disallowed prefixes" test must still catch unrelated prefixes).
4. Mention it in the README notes section.

**Add a new unit suffix:**
1. `lib/parser.js` — add to the `UNIT_RE` alternation.
2. Add a class using the new unit to `test/fixtures/golden.html`.
3. `UPDATE_GOLDEN=1 npm test`.
4. Update the README note listing supported units.

**Add a new keyword:**
1. `lib/grid-parser.js` — add entry to `KEYWORD_MAP`.
2. Add the keyword (+ breakpoint variant) to `test/fixtures/golden.html`.
3. `UPDATE_GOLDEN=1 npm test`.
4. Update the Keyword Classes table in `README.md`.

**Add a new diagnostic:**
1. `lib/parser.js` — extend `diagnoseClass`. Put the new pattern check in priority order (most specific first).
2. Add a sub-case to the `diagnoseClass explains common mistakes` test in `test/cli.test.js`.
3. Add the triggering class to `test/fixtures/golden.classes.txt` and refresh the diagnostics golden.

**Change generator output shape:**
Any change that alters emitted CSS (rounding, escaping, rule formatting, breakpoint grouping) will fail the golden test. If intentional: `UPDATE_GOLDEN=1 npm test`, review the diff, commit code change + refreshed fixtures **in the same commit**.

## Canonical references

- **`README.md`** — user-facing class syntax. The golden test does NOT guard the README, so **update it manually** when `PREFIX_MAP` / `UNIT_RE` / `KEYWORD_MAP` change.
- **`test/fixtures/golden.html`** — every supported class shape in one file. Executable reference for "what syntax works right now."
- **`test/fixtures/golden.expected.*`** — current compiled output, committed. Never hand-edit; regenerate via `UPDATE_GOLDEN=1`.
- **`dopamine.config.json`** (root) — default breakpoints + viewport. `docs/dopamine.config.json` is a separate config for the docs site.

## Testing workflow

- **`npm test`** — runs 69 tests (unit + integration + golden + manifest v2 + negative-value gating + grid item span).
- **`UPDATE_GOLDEN=1 npm test`** — regenerates the three `test/fixtures/golden.expected.*` files when output intentionally changes.
- **`prepublishOnly` hook** — `npm test` runs before `npm publish`. Can't ship a broken build.

## Performance

Opt-in phase timings:
```
DOPAMINE_TIMING=1 node bin/dopamine.js <input> --manifest out.json
```
Prints a `scan / parse / generate / manifest` breakdown after the build summary.

Reproducible benchmark:
```
node scripts/bench.js --files 200 --classes-per-file 100
```

Measured at 200 files × 100 classes (2026-04-15, WSL2):
- **Full build: ~20 ms median.**
- Manifest write: ~7 ms (object serialize + writeFile).
- Scan phase: ~11 ms (Map-based counting, same regex as before).
- Watch mode reruns the same pipeline on every save — perceptually instant at this scale.

`writeManifest` also skips the write when the new manifest is identical to the existing file (content-compared). This prevents the extension's `FileSystemWatcher` from firing on no-op rebuilds. Logged as `Manifest unchanged → skipped write` only when `DOPAMINE_TIMING=1`.

Test file layout:
- `test/cli.test.js` — parser, generator, extractor, diagnostic + CLI integration
- `test/golden.test.js` — full-pipeline snapshot
- `test/manifest.test.js` — manifest + CLI spawn patterns (copy this shape when adding new CLI integration tests)
- `test/init.test.js` — `scaffoldProject`
- `test/update.test.js` — update-message

## Gotchas

- **Default breakpoints merge with user config.** `loadConfig` does `{...defaults.breakpoints, ...user.breakpoints}`. To remove a default (e.g. `xxl`), set it to `null` in user config — omitting keeps the default. That's why the golden fixture triggers the unknown-breakpoint diagnostic via `fs-xxxl-16`, not `fs-xxl-16`.
- **Generated header includes a timestamp** — all tests and golden snapshots use `--no-header` to keep output stable. Don't remove the timestamp from user-facing output; just strip the header in tests.
- **Selector escaping is automatic** — `escapeSelector` in `generator.js` + `grid-generator.js` handles `%`, `.`, and other non-alphanumerics. Don't pre-escape in `PREFIX_MAP` props.
- **`_dopamine-functions.scss` is auto-generated** alongside `.scss` output. The standalone `addons/sass/_dopamine-functions.scss` is a separate hand-authored file with default values baked in — consumers pick one based on whether they run the CLI or not.
- **`container-N` does NOT support breakpoint variants** — `container-md-1200` doesn't parse. Known gap; not fixed.
- **Width fluid-ranges still exist** — while `h`/`maxh`/`minh` are `fixedOnly`, `w`/`maxw`/`minw` still accept fluid ranges. Intentional — widths scale sensibly with viewport width.
- **`cli-options.js` `applyConfigHints` is the single reconciliation point** between CLI flags and config-file values. New flags that should have a config alias: edit there.

## Where NOT to edit

- **`docs/scss/_dopamine.scss`** — auto-generated by `npm run docs:dopamine`. Edit sources in `docs/*.html`.
- **`test/fixtures/golden.expected.*`** — regenerated via `UPDATE_GOLDEN=1 npm test`. Never hand-edit.
- **`addons/components/*.{scss,js}`** — hand-authored component CSS/JS. Not under the generator's purview; golden test doesn't cover them. Scaffolding tests (`test/init.test.js`) verify they ship correctly.
- **`addons/sass/_dopamine-functions.scss`** — hand-authored standalone Sass addon. Separate from the auto-generated `_dopamine-functions.scss` (generated one lives in the output `scss/` dir); both ship.
- **`starter/`** — templates copied by `scaffoldProject` during `dopamine init`. Changes affect new-project scaffolds; `test/init.test.js` guards shape.
