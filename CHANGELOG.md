# Changelog

## 1.0.0 — 2026-03-23

### Changed

- **BREAKING:** `Game` type no longer has a `round` field. Round is determined
  by array position: `games[n]` = round n+1.
- **BREAKING:** `roundRobin()` renamed to `pair()`.
- **BREAKING:** `round` parameter removed — derived from `games.length + 1`.

### Removed

- `schedule()` function — loop over rounds and call `pair()` instead.
