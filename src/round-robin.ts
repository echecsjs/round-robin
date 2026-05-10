import { BERGER_TABLES } from './berger.js';

import type { CompletedRound, Pairings, Player } from './types.js';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 3;

function effectiveSize(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

function totalRounds(n: number): number {
  return effectiveSize(n) - 1;
}

function validate(players: Player[], round?: number): void {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new RangeError(
      `Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${players.length}`,
    );
  }

  if (round !== undefined) {
    const rounds = totalRounds(players.length);
    if (round < 1 || round > rounds) {
      throw new RangeError(
        `Round must be between 1 and ${rounds}, got ${round}`,
      );
    }
  }
}

function pair(players: Player[], _rounds: CompletedRound[]): Pairings {
  const round = _rounds.length + 1;
  validate(players, round);

  const size = effectiveSize(players.length);
  const table = BERGER_TABLES[size];
  const roundPairings = table?.[round - 1];
  const isOdd = players.length % 2 !== 0;
  const byeIndex = size - 1;

  if (roundPairings === undefined) {
    throw new RangeError(
      `No Berger table entry for size ${size}, round ${round}`,
    );
  }

  const games: Pairings['games'] = [];
  const byes: Pairings['byes'] = [];

  for (const [whiteIndex, blackIndex] of roundPairings) {
    if (isOdd && (whiteIndex === byeIndex || blackIndex === byeIndex)) {
      const playerIndex = whiteIndex === byeIndex ? blackIndex : whiteIndex;
      const player = players[playerIndex];
      if (player !== undefined) {
        byes.push({ kind: 'pairing', player: player.id });
      }
    } else {
      const white = players[whiteIndex];
      const black = players[blackIndex];
      if (white !== undefined && black !== undefined) {
        games.push({
          black: black.id,
          white: white.id,
        });
      }
    }
  }

  return { byes, games };
}

export { pair };
