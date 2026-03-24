# Round Robin

[![npm](https://img.shields.io/npm/v/@echecs/round-robin)](https://www.npmjs.com/package/@echecs/round-robin)
[![Test](https://github.com/mormubis/round-robin/actions/workflows/test.yml/badge.svg)](https://github.com/mormubis/round-robin/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/mormubis/round-robin/branch/main/graph/badge.svg)](https://codecov.io/gh/mormubis/round-robin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
import { roundRobin, schedule } from '@echecs/round-robin';
import type { Player } from '@echecs/round-robin';

const players: Player[] = [
  { id: 'alice' },
  { id: 'bob' },
  { id: 'carol' },
  { id: 'dave' },
];

// Get pairings for round 1
const round1 = roundRobin(players, [], 1);
console.log(round1.pairings);
// [{ whiteId: 'alice', blackId: 'dave' }, { whiteId: 'bob', blackId: 'carol' }]

// Get the full schedule (all rounds at once)
const allRounds = schedule(players);
console.log(allRounds.length); // 3
```

## API

### `roundRobin()`

```typescript
function roundRobin(
  players: Player[],
  games: Game[],
  round: number,
): PairingResult;
```

Returns pairings for a specific round number.

- `players` — all registered players, ordered by seed (index 0 = seed 1)
- `games` — accepted for interface compatibility with
  [`@echecs/swiss`](https://www.npmjs.com/package/@echecs/swiss); ignored
- `round` — the round number to generate pairings for (1-based)

Throws `RangeError` if:

- Fewer than 3 or more than 16 players
- `round` is less than 1 or greater than the total number of rounds

```typescript
interface PairingResult {
  byes: Bye[]; // players with no opponent this round
  pairings: Pairing[]; // white/black assignments
}

interface Pairing {
  blackId: string;
  whiteId: string;
}

interface Bye {
  playerId: string;
}
```

### `schedule()`

```typescript
function schedule(players: Player[]): PairingResult[];
```

Returns the complete schedule — one `PairingResult` per round. Equivalent to
calling `roundRobin()` for every round.

Throws `RangeError` if fewer than 3 or more than 16 players.

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
const round1 = roundRobin(seeded, [], 1);
```

## Byes

For odd player counts, one player receives a bye each round. Per FIDE rules, the
highest-numbered seed is the bye seat — so the player paired against that seat
gets the bye.

```typescript
const players: Player[] = [{ id: 'alice' }, { id: 'bob' }, { id: 'carol' }];

const round1 = roundRobin(players, [], 1);
console.log(round1.byes);
// [{ playerId: 'alice' }]
console.log(round1.pairings);
// [{ whiteId: 'bob', blackId: 'carol' }]
```

## Unified Pairing Interface

The `roundRobin` function shares the same signature as Swiss pairing functions
in `@echecs/swiss`:

```typescript
type PairingSystem = (
  players: Player[],
  games: Game[],
  round: number,
) => PairingResult;
```

This enables a future `@echecs/tournament` package to consume any pairing system
through a single interface. The `games` parameter is accepted but ignored —
round-robin pairings are fully determined by seeding order and round number.

```typescript
import { dutch } from '@echecs/swiss';
import { roundRobin } from '@echecs/round-robin';
import type { PairingResult, Player, Game } from '@echecs/round-robin';

type PairingSystem = (
  players: Player[],
  games: Game[],
  round: number,
) => PairingResult;

// Both work as a PairingSystem
const system: PairingSystem = useSwiss ? dutch : roundRobin;
const pairings = system(players, games, round);
```

## Types

```typescript
interface Player {
  id: string;
  rating?: number;
}

interface Game {
  blackId: string;
  result: Result;
  round: number;
  whiteId: string;
}

type Result = 0 | 0.5 | 1;
```

## FIDE References

- [C.05 General Regulations for Competitions](https://handbook.fide.com/chapter/C05GeneralRegulations)
- [C.05 Annex 1: Berger Tables](https://handbook.fide.com/chapter/C05Annex1)

## License

MIT
