# Round Robin

[![npm](https://img.shields.io/npm/v/@echecs/round-robin)](https://www.npmjs.com/package/@echecs/round-robin)
[![Coverage](https://codecov.io/gh/echecsjs/round-robin/branch/main/graph/badge.svg)](https://codecov.io/gh/echecsjs/round-robin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec](https://img.shields.io/badge/Spec-FIDE-green.svg)](SPEC.md)

**Round Robin** is a TypeScript library for round-robin (all-play-all) chess
tournament pairings, following the official
[FIDE Berger tables](https://handbook.fide.com/chapter/C05Annex1) (Handbook
C.05, Annex 1). Supports 3 to 16 players. Zero runtime dependencies.

Pairings are generated from hardcoded FIDE tables — no algorithmic generation.
This guarantees bit-exact compliance with the published FIDE specification.

## Installation

```bash
npm install @echecs/round-robin
```

## Quick Start

```typescript
import { pair } from '@echecs/round-robin';
import type { Player } from '@echecs/round-robin';

const players: Player[] = [
  { id: 'alice' },
  { id: 'bob' },
  { id: 'carol' },
  { id: 'dave' },
];

// Get pairings for round 1 (no previous games)
const round1 = pair(players, []);
console.log(round1.pairings);
// [{ white: 'alice', black: 'dave' }, { white: 'bob', black: 'carol' }]

// After recording round-1 results, pair round 2
// games[n] = round n+1; Game has no `round` field
const games = [
  [
    { white: 'alice', black: 'dave', result: 1 },
    { white: 'bob', black: 'carol', result: 0.5 },
  ],
];
const round2 = pair(players, games); // next round = games.length + 1 = 2
```

## API

### `pair(players, games)`

```typescript
function pair(players: Player[], games: Game[][]): PairingResult;
```

Returns pairings for the next round.

- `players` — all registered players, ordered by seed (index 0 = seed 1)
- `games` — completed games grouped by round: `games[0]` = round 1, `games[1]` =
  round 2, … The round to pair is `games.length + 1`. The `games` parameter is
  accepted for interface compatibility with `@echecs/swiss` but is ignored —
  pairings are fully determined by seeding order and round index.

The `Game` type has no `round` field — round is encoded by array position.

Throws `RangeError` if:

- Fewer than 3 or more than 16 players
- `games.length + 1` exceeds the total number of rounds

```typescript
interface PairingResult {
  byes: Bye[]; // players with no opponent this round
  pairings: Pairing[]; // white/black assignments
}

interface Pairing {
  black: string;
  white: string;
}

interface Bye {
  player: string;
}
```

### Number of rounds

| Players | Rounds |
| ------- | ------ |
| 3-4     | 3      |
| 5-6     | 5      |
| 7-8     | 7      |
| 9-10    | 9      |
| 11-12   | 11     |
| 13-14   | 13     |
| 15-16   | 15     |

Odd player counts are padded to the next even number. The total number of rounds
is always `effectiveSize - 1`.

## Seeding

Seeding is determined by array position — index 0 is seed 1, index 1 is seed 2,
etc. The caller controls seed order by arranging the `players` array before
calling the pairing function.

```typescript
// Seed by rating (highest first)
const seeded = players.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
const round1 = pair(seeded, []);
```

## Byes

For odd player counts, one player receives a bye each round. Per FIDE rules, the
highest-numbered seed is the bye seat — so the player paired against that seat
gets the bye.

```typescript
const players: Player[] = [{ id: 'alice' }, { id: 'bob' }, { id: 'carol' }];

const round1 = pair(players, []);
console.log(round1.byes);
// [{ player: 'alice' }]
console.log(round1.pairings);
// [{ white: 'bob', black: 'carol' }]
```

## Unified Pairing Interface

The `pair` function shares the same signature as Swiss pairing functions in
`@echecs/swiss`:

```typescript
type PairingSystem = (players: Player[], games: Game[][]) => PairingResult;
```

This enables `@echecs/tournament` to consume any pairing system through a single
interface. The `games` parameter is accepted but ignored.

```typescript
import { pair as dutch } from '@echecs/swiss';
import { pair as roundRobin } from '@echecs/round-robin';
import type { PairingResult, Player, Game } from '@echecs/round-robin';

type PairingSystem = (players: Player[], games: Game[][]) => PairingResult;

// Both work as a PairingSystem
const system: PairingSystem = useSwiss ? dutch : roundRobin;
const pairings = system(players, games);
```

## Types

```typescript
interface Player {
  id: string;
  rating?: number;
}

interface Game {
  black: string;
  kind?: GameKind;
  result: Result;
  white: string;
  // No `round` field — round is encoded by position in Game[][]
}

type GameKind =
  | 'forfeit-loss'
  | 'forfeit-win'
  | 'full-bye'
  | 'half-bye'
  | 'pairing-bye'
  | 'zero-bye';

type Result = 0 | 0.5 | 1;
```

## FIDE References

- [C.05 General Regulations for Competitions](https://handbook.fide.com/chapter/C05GeneralRegulations)
- [C.05 Annex 1: Berger Tables](https://handbook.fide.com/chapter/C05Annex1)

## License

MIT
