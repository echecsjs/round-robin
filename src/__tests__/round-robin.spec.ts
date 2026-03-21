import { describe, expect, it } from 'vitest';

import { roundRobin, schedule } from '../index.js';

import type { Player } from '../index.js';

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, index) => ({ id: `P${index + 1}` }));
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

describe('roundRobin()', () => {
  describe('FIDE Berger table — 4 players', () => {
    const p = players(4);

    it('round 1: 1-4, 2-3', () => {
      expect(roundRobin(p, [], 1)).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P1', blackId: 'P4' },
          { whiteId: 'P2', blackId: 'P3' },
        ],
      });
    });

    it('round 2: 4-3, 1-2', () => {
      expect(roundRobin(p, [], 2)).toEqual({
        byes: [],
        pairings: [
          { whiteId: 'P4', blackId: 'P3' },
          { whiteId: 'P1', blackId: 'P2' },
        ],
      });
    });

    it('round 3: 2-4, 3-1', () => {
      expect(roundRobin(p, [], 3)).toEqual({
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
      expect(roundRobin(p, [], 1)).toEqual({
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
      expect(roundRobin(p, [], 7)).toEqual({
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
      for (let r = 1; r <= 3; r++) {
        const result = roundRobin(p, [], r);
        expect(result.byes).toHaveLength(1);
        expect(result.pairings).toHaveLength(1);
      }
    });

    it('P1 gets bye in round 1 (seat 4 is bye seat)', () => {
      const result = roundRobin(p, [], 1);
      // Round 1 FIDE: 1-4, 2-3 → seat 4 is bye → P1 gets bye
      expect(result.byes).toEqual([{ playerId: 'P1' }]);
      expect(result.pairings).toEqual([{ whiteId: 'P2', blackId: 'P3' }]);
    });
  });

  describe('validation', () => {
    it('throws RangeError for fewer than 3 players', () => {
      expect(() => roundRobin(players(2), [], 1)).toThrow(RangeError);
    });

    it('throws RangeError for more than 16 players', () => {
      expect(() => roundRobin(players(17), [], 1)).toThrow(RangeError);
    });

    it('throws RangeError for round 0', () => {
      expect(() => roundRobin(players(4), [], 0)).toThrow(RangeError);
    });

    it('throws RangeError for round beyond max (4 players → max 3)', () => {
      expect(() => roundRobin(players(4), [], 4)).toThrow(RangeError);
    });

    it('throws RangeError for round beyond max (6 players → max 5)', () => {
      expect(() => roundRobin(players(6), [], 6)).toThrow(RangeError);
    });
  });

  describe('interface compatibility', () => {
    it('accepts a games array and ignores it', () => {
      const p = players(4);
      const games = [
        { blackId: 'P4', result: 1 as const, round: 1, whiteId: 'P1' },
      ];
      expect(() => roundRobin(p, games, 2)).not.toThrow();
    });
  });
});

describe('schedule()', () => {
  it('returns 3 rounds for 4 players', () => {
    expect(schedule(players(4))).toHaveLength(3);
  });

  it('returns 5 rounds for 5 players (padded to 6)', () => {
    expect(schedule(players(5))).toHaveLength(5);
  });

  it('throws RangeError for fewer than 3 players', () => {
    expect(() => schedule(players(2))).toThrow(RangeError);
  });

  it('throws RangeError for more than 16 players', () => {
    expect(() => schedule(players(17))).toThrow(RangeError);
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
