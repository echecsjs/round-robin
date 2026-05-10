import { describe, expect, it } from 'vitest';

import { pair } from '../index.js';

import type { CompletedRound, Player } from '../index.js';

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, index) => ({
    id: `P${index + 1}`,
    points: 0,
    rank: index + 1,
  }));
}

function schedule(p: Player[]) {
  const size = p.length % 2 === 0 ? p.length : p.length + 1;
  const rounds = size - 1;
  const result = [];
  const completedRounds: CompletedRound[] = [];
  for (let r = 0; r < rounds; r++) {
    const roundResult = pair(p, completedRounds);
    result.push(roundResult);
    completedRounds.push({ byes: [], games: [] });
  }
  return result;
}

function checkCompleteness(n: number): void {
  const p = players(n);
  const rounds = schedule(p);
  const encounters = new Map<string, Set<string>>();

  for (const player of p) {
    encounters.set(player.id, new Set());
  }

  for (const { games } of rounds) {
    for (const { black, white } of games) {
      encounters.get(white)?.add(black);
      encounters.get(black)?.add(white);
    }
  }

  for (const player of p) {
    const opponents = encounters.get(player.id) ?? new Set<string>();
    const expected = p.filter((q) => q.id !== player.id).map((q) => q.id);
    for (const opp of expected) {
      expect(opponents.has(opp)).toBe(true);
    }
    expect(opponents.size).toBe(n - 1);
  }
}

function checkCoverage(n: number): void {
  const p = players(n);
  const rounds = schedule(p);
  const playerIds = new Set(p.map((pl) => pl.id));

  for (const { byes, games } of rounds) {
    const seen = new Set<string>();

    for (const { black, white } of games) {
      expect(seen.has(white)).toBe(false);
      expect(seen.has(black)).toBe(false);
      seen.add(white);
      seen.add(black);
    }

    for (const { player } of byes) {
      expect(seen.has(player)).toBe(false);
      seen.add(player);
    }

    expect(seen).toEqual(playerIds);
  }
}

describe('pair()', () => {
  describe('FIDE Berger table — 4 players', () => {
    const p = players(4);

    it('round 1: 1-4, 2-3', () => {
      expect(pair(p, [])).toEqual({
        byes: [],
        games: [
          { white: 'P1', black: 'P4' },
          { white: 'P2', black: 'P3' },
        ],
      });
    });

    it('round 2: 4-3, 1-2', () => {
      expect(pair(p, [{ byes: [], games: [] }])).toEqual({
        byes: [],
        games: [
          { white: 'P4', black: 'P3' },
          { white: 'P1', black: 'P2' },
        ],
      });
    });

    it('round 3: 2-4, 3-1', () => {
      expect(
        pair(p, [
          { byes: [], games: [] },
          { byes: [], games: [] },
        ]),
      ).toEqual({
        byes: [],
        games: [
          { white: 'P2', black: 'P4' },
          { white: 'P3', black: 'P1' },
        ],
      });
    });
  });

  describe('FIDE Berger table — 8 players', () => {
    const p = players(8);

    it('round 1: 1-8, 2-7, 3-6, 4-5', () => {
      expect(pair(p, [])).toEqual({
        byes: [],
        games: [
          { white: 'P1', black: 'P8' },
          { white: 'P2', black: 'P7' },
          { white: 'P3', black: 'P6' },
          { white: 'P4', black: 'P5' },
        ],
      });
    });

    it('round 7: 4-8, 5-3, 6-2, 7-1', () => {
      expect(
        pair(p, [
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
        ]),
      ).toEqual({
        byes: [],
        games: [
          { white: 'P4', black: 'P8' },
          { white: 'P5', black: 'P3' },
          { white: 'P6', black: 'P2' },
          { white: 'P7', black: 'P1' },
        ],
      });
    });
  });

  describe('odd player count — 3 players', () => {
    const p = players(3);

    it('produces one bye per round', () => {
      for (let r = 0; r < 3; r++) {
        const completedRounds: CompletedRound[] = Array.from(
          { length: r },
          () => ({ byes: [], games: [] }),
        );
        const result = pair(p, completedRounds);
        expect(result.byes).toHaveLength(1);
        expect(result.games).toHaveLength(1);
      }
    });

    it('P1 gets bye in round 1 (seat 4 is bye seat)', () => {
      const result = pair(p, []);
      // Round 1 FIDE: 1-4, 2-3 → seat 4 is bye → P1 gets bye
      expect(result.byes).toEqual([{ kind: 'pairing', player: 'P1' }]);
      expect(result.games).toEqual([{ white: 'P2', black: 'P3' }]);
    });
  });

  describe('validation', () => {
    it('throws RangeError for fewer than 3 players', () => {
      expect(() => pair(players(2), [])).toThrow(RangeError);
    });

    it('throws RangeError for more than 16 players', () => {
      expect(() => pair(players(17), [])).toThrow(RangeError);
    });

    it('throws RangeError when games.length implies round 0 is invalid', () => {
      // 4 players → max 3 rounds; passing 3 prior rounds means round 4, which is invalid
      expect(() =>
        pair(players(4), [
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
        ]),
      ).toThrow(RangeError);
    });

    it('throws RangeError when games.length implies round beyond max (6 players → max 5)', () => {
      expect(() =>
        pair(players(6), [
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
          { byes: [], games: [] },
        ]),
      ).toThrow(RangeError);
    });
  });

  describe('interface compatibility', () => {
    it('accepts a completed rounds array and ignores contents', () => {
      const p = players(4);
      const completedRounds: CompletedRound[] = [
        {
          byes: [],
          games: [{ black: 'P4', result: 'white', white: 'P1' }],
        },
      ];
      expect(() => pair(p, completedRounds)).not.toThrow();
    });
  });
});

describe('completeness invariant — every player faces every other exactly once', () => {
  for (let n = 3; n <= 16; n++) {
    // eslint-disable-next-line vitest/expect-expect
    it(`${n} players`, () => {
      checkCompleteness(n);
    });
  }
});

describe('coverage invariant — every round includes all players exactly once', () => {
  for (let n = 3; n <= 16; n++) {
    // eslint-disable-next-line vitest/expect-expect
    it(`${n} players`, () => {
      checkCoverage(n);
    });
  }
});
