import { describe, expect, it } from 'vitest';

import { pair } from '../index.js';

import type { Game, Player } from '../index.js';

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, index) => ({ id: `P${index + 1}` }));
}

function schedule(p: Player[]) {
  const size = p.length % 2 === 0 ? p.length : p.length + 1;
  const rounds = size - 1;
  const result = [];
  const games: Game[][] = [];
  for (let r = 0; r < rounds; r++) {
    const roundResult = pair(p, games);
    result.push(roundResult);
    games.push([]);
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

  for (const { pairings } of rounds) {
    for (const { blackId, whiteId } of pairings) {
      encounters.get(whiteId)?.add(blackId);
      encounters.get(blackId)?.add(whiteId);
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

  for (const { byes, pairings } of rounds) {
    const seen = new Set<string>();

    for (const { blackId, whiteId } of pairings) {
      expect(seen.has(whiteId)).toBe(false);
      expect(seen.has(blackId)).toBe(false);
      seen.add(whiteId);
      seen.add(blackId);
    }

    for (const { playerId } of byes) {
      expect(seen.has(playerId)).toBe(false);
      seen.add(playerId);
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
        pairings: [
          { whiteId: 'P1', blackId: 'P4' },
          { whiteId: 'P2', blackId: 'P3' },
        ],
      });
    });

    it('round 2: 4-3, 1-2', () => {
      expect(pair(p, [[]])).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P4', blackId: 'P3' },
          { whiteId: 'P1', blackId: 'P2' },
        ],
      });
    });

    it('round 3: 2-4, 3-1', () => {
      expect(pair(p, [[], []])).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P2', blackId: 'P4' },
          { whiteId: 'P3', blackId: 'P1' },
        ],
      });
    });
  });

  describe('FIDE Berger table — 8 players', () => {
    const p = players(8);

    it('round 1: 1-8, 2-7, 3-6, 4-5', () => {
      expect(pair(p, [])).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P1', blackId: 'P8' },
          { whiteId: 'P2', blackId: 'P7' },
          { whiteId: 'P3', blackId: 'P6' },
          { whiteId: 'P4', blackId: 'P5' },
        ],
      });
    });

    it('round 7: 4-8, 5-3, 6-2, 7-1', () => {
      expect(pair(p, [[], [], [], [], [], []])).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P4', blackId: 'P8' },
          { whiteId: 'P5', blackId: 'P3' },
          { whiteId: 'P6', blackId: 'P2' },
          { whiteId: 'P7', blackId: 'P1' },
        ],
      });
    });
  });

  describe('odd player count — 3 players', () => {
    const p = players(3);

    it('produces one bye per round', () => {
      for (let r = 0; r < 3; r++) {
        const games: Game[][] = Array.from({ length: r }, () => []);
        const result = pair(p, games);
        expect(result.byes).toHaveLength(1);
        expect(result.pairings).toHaveLength(1);
      }
    });

    it('P1 gets bye in round 1 (seat 4 is bye seat)', () => {
      const result = pair(p, []);
      // Round 1 FIDE: 1-4, 2-3 → seat 4 is bye → P1 gets bye
      expect(result.byes).toEqual([{ playerId: 'P1' }]);
      expect(result.pairings).toEqual([{ whiteId: 'P2', blackId: 'P3' }]);
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
      expect(() => pair(players(4), [[], [], []])).toThrow(RangeError);
    });

    it('throws RangeError when games.length implies round beyond max (6 players → max 5)', () => {
      expect(() => pair(players(6), [[], [], [], [], []])).toThrow(RangeError);
    });
  });

  describe('interface compatibility', () => {
    it('accepts a games array and ignores contents', () => {
      const p = players(4);
      const games: { blackId: string; result: 1; whiteId: string }[][] = [
        [{ blackId: 'P4', result: 1, whiteId: 'P1' }],
      ];
      expect(() => pair(p, games)).not.toThrow();
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
