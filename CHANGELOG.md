# Changelog

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
