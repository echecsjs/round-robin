# AGENTS.md

Agent guidance for the `@echecs/round-robin` package — round-robin tournament
pairings using FIDE Berger tables (C.05 Annex 1).

See the root `AGENTS.md` for workspace-wide conventions (package manager,
TypeScript settings, formatting, naming, testing, ESLint rules).

---

## Project Overview

Pure lookup library, no runtime dependencies. Generates round-robin pairings
from hardcoded FIDE Berger tables for 3-16 players. Exports one pairing function
(`roundRobin`), one convenience function (`schedule`), and shared types
compatible with `@echecs/swiss`.

---

## Commands

### Build

```bash
pnpm run build          # bundle TypeScript → dist/ via tsdown
```

### Test

```bash
pnpm run test                          # run all tests once
pnpm run test:watch                    # watch mode
pnpm run test:coverage                 # with coverage report

# Run a single test file
pnpm run test src/__tests__/round-robin.spec.ts

# Run a single test by name (substring match)
pnpm run test -- --reporter=verbose -t "schedule"
```

### Lint & Format

```bash
pnpm run lint           # ESLint + tsc type-check (auto-fixes style issues)
pnpm run lint:ci        # strict — zero warnings allowed, no auto-fix
pnpm run lint:style     # ESLint only (auto-fixes)
pnpm run lint:types     # tsc --noEmit type-check only
pnpm run format         # Prettier (writes changes)
pnpm run format:ci      # Prettier check only (no writes)
```

### Full pre-PR check

```bash
pnpm lint && pnpm test && pnpm build
```

---

## FIDE References

- C.05 General Regulations:
  https://handbook.fide.com/chapter/C05GeneralRegulations
- C.05 Annex 1 Berger Tables: https://handbook.fide.com/chapter/C05Annex1

---

## Architecture Notes

- **ESM-only** — the package ships only ESM. Do not add a CJS build.
- No runtime dependencies — keep it that way.
- The Berger tables are stored in `src/berger.ts` as a static lookup,
  transcribed directly from FIDE Handbook C.05 Annex 1.
- Supports 3-16 players. This is a hard constraint matching the FIDE spec.
- Odd player counts are padded to the next even number; the highest seat becomes
  the bye seat.
- All interface fields sorted alphabetically (`sort-keys` is an ESLint error).
- Always use `.js` extensions on relative imports (NodeNext resolution).
- The `roundRobin()` function accepts a `games` parameter for interface
  compatibility with `@echecs/swiss` pairing functions but ignores it.

---

## Unified Pairing Interface

The `roundRobin` function conforms to the same signature as Swiss pairing
functions:

```typescript
type PairingSystem = (
  players: Player[],
  games: Game[],
  round: number,
) => PairingResult;
```

This enables a future `@echecs/tournament` package to consume any pairing system
through a single interface.

---

## Validation

Input validation is mostly provided by TypeScript's strict type system at
compile time. Runtime validation is limited to domain constraints: player count
(3-16) and round number range.

---

## Error Handling

- Throw `RangeError` for domain violations: player count outside 3-16, round
  number outside valid range.
