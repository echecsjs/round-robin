# Changelog

## [3.0.3] - 2026-05-01

### Changed

- Types are now imported from `@echecs/tournament` instead of locally defined.
- `@echecs/tournament` is declared as a peer dependency to ensure type identity
  with the consumer's installed copy.

## [3.0.2] - 2026-04-17

### Fixed

- Added top-level `types` field to `package.json` for TypeScript configs that
  don't resolve types through `exports` conditions.

## 3.0.1 — 2026-04-09

### Fixed

- Documented `GameKind` type export and `Game.kind` field in README.

## 2.0.0 — 2026-03-24

### Changed

- **BREAKING:** Renamed `Game.blackId` → `Game.black`, `Game.whiteId` →
  `Game.white`.
- **BREAKING:** Renamed `Pairing.blackId` → `Pairing.black`, `Pairing.whiteId` →
  `Pairing.white`.
- **BREAKING:** Renamed `Bye.playerId` → `Bye.player`.

## 1.0.0 — 2026-03-23

### Changed

- **BREAKING:** `Game` type no longer has a `round` field. Round is determined
  by array position: `games[n]` = round n+1.
- **BREAKING:** `roundRobin()` renamed to `pair()`.
- **BREAKING:** `round` parameter removed — derived from `games.length + 1`.

### Removed

- `schedule()` function — loop over rounds and call `pair()` instead.
