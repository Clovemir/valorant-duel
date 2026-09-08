import assert from "node:assert/strict";
import test from "node:test";
import {
  bracketSize,
  calculateStandings,
  pairKey,
  pairSwissRound,
  playoffSize,
  playoffStage,
  roundRobinFixtures,
  swissRoundCount,
  validateScore,
} from "./competition.ts";

test("round robin creates every pairing exactly once", () => {
  for (const count of [3, 4, 5, 6]) {
    const ids = Array.from({ length: count }, (_, index) => index + 1);
    const pairs = roundRobinFixtures(ids).flat();
    const unique = new Set(pairs.map(([a, b]) => pairKey(a, b)));
    assert.equal(unique.size, (count * (count - 1)) / 2);
    assert.equal(pairs.length, unique.size);
    assert.ok(pairs.every(([a, b]) => a !== b));
  }
});

test("swiss pairing avoids rematches when another opponent exists", () => {
  const prior = new Set([pairKey(1, 2), pairKey(3, 4)]);
  const result = pairSwissRound([1, 2, 3, 4], prior);
  assert.equal(result.byeParticipantId, null);
  assert.ok(result.pairs.every(([a, b]) => !prior.has(pairKey(a, b))));
});

test("swiss pairing returns one bye for an odd field", () => {
  const result = pairSwissRound([1, 2, 3, 4, 5], new Set());
  assert.equal(result.pairs.length, 2);
  assert.notEqual(result.byeParticipantId, null);
});

test("competition format boundaries remain stable", () => {
  assert.equal(swissRoundCount(7), 4);
  assert.equal(swissRoundCount(13), 5);
  assert.equal(swissRoundCount(25), 6);
  assert.equal(playoffSize(3), 3);
  assert.equal(playoffSize(6), 4);
  assert.equal(playoffSize(7), 4);
  assert.equal(playoffSize(15), 8);
  assert.equal(playoffSize(16), 16);
  assert.equal(bracketSize(3), 4);
  assert.equal(playoffStage(8, 4), "playoff_quarterfinal");
  assert.equal(playoffStage(8, 1), "playoff_final");
});

test("score validation requires exactly one player at the target", () => {
  assert.equal(validateScore(15, 14, 15), true);
  assert.equal(validateScore(14, 15, 15), true);
  assert.equal(validateScore(15, 15, 15), false);
  assert.equal(validateScore(16, 10, 15), false);
  assert.equal(validateScore(-1, 15, 15), false);
  assert.equal(validateScore(15, 2.5, 15), false);
});

test("standings calculate wins, losses, rounds and ignore rejected players", () => {
  const standings = calculateStandings(
    [
      { id: 1, nickname: "Alpha", status: "approved" },
      { id: 2, nickname: "Bravo", status: "approved" },
      { id: 3, nickname: "Charlie", status: "rejected" },
    ],
    [
      { player1Id: 1, player2Id: 2, player1Score: 15, player2Score: 9, winnerId: 1 },
      { player1Id: 1, player2Id: 3, player1Score: 0, player2Score: 15, winnerId: 3 },
    ],
    "round_robin",
  );
  assert.equal(standings.length, 2);
  assert.deepEqual(standings[0], {
    participantId: 1,
    nickname: "Alpha",
    played: 1,
    wins: 1,
    losses: 0,
    pointsFor: 15,
    pointsAgainst: 9,
    differential: 6,
    rank: 1,
  });
});

test("swiss standings use opponents' wins before round differential", () => {
  const standings = calculateStandings(
    [
      { id: 1, nickname: "Alpha", status: "approved" },
      { id: 2, nickname: "Bravo", status: "approved" },
      { id: 3, nickname: "Charlie", status: "approved" },
      { id: 4, nickname: "Delta", status: "approved" },
    ],
    [
      { player1Id: 1, player2Id: 2, player1Score: 15, player2Score: 14, winnerId: 1 },
      { player1Id: 3, player2Id: 4, player1Score: 15, player2Score: 1, winnerId: 3 },
      { player1Id: 2, player2Id: 3, player1Score: 15, player2Score: 14, winnerId: 2 },
    ],
    "swiss",
  );
  assert.equal(standings[0].participantId, 2);
  assert.equal(standings[1].participantId, 3);
});