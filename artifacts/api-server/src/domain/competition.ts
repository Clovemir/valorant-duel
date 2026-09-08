export type Pair = [number, number];
export type StandingParticipant = {
  id: number;
  nickname: string;
  status: string;
};
export type StandingMatch = {
  player1Id: number | null;
  player2Id: number | null;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: number | null;
};

export function swissRoundCount(participantCount: number) {
  if (participantCount <= 12) return 4;
  if (participantCount <= 24) return 5;
  if (participantCount <= 48) return 6;
  return Math.min(10, Math.ceil(Math.log2(participantCount)) + 1);
}

export function roundRobinFixtures(ids: number[]) {
  const slots: (number | null)[] = ids.length % 2 ? [...ids, null] : [...ids];
  const rounds: Pair[][] = [];

  for (let round = 0; round < slots.length - 1; round++) {
    const pairs: Pair[] = [];
    for (let index = 0; index < slots.length / 2; index++) {
      const first = slots[index];
      const second = slots[slots.length - 1 - index];
      if (first && second) pairs.push([first, second]);
    }
    rounds.push(pairs);
    const last = slots.pop()!;
    slots.splice(1, 0, last);
  }

  return rounds;
}

export function pairSwissRound(
  rankedIds: number[],
  priorPairKeys: ReadonlySet<string>,
) {
  const pool = [...rankedIds];
  const pairs: Pair[] = [];

  while (pool.length > 1) {
    const first = pool.shift()!;
    let opponentIndex = pool.findIndex(
      opponent => !priorPairKeys.has(pairKey(first, opponent)),
    );
    if (opponentIndex < 0) opponentIndex = 0;
    pairs.push([first, pool.splice(opponentIndex, 1)[0]]);
  }

  return { pairs, byeParticipantId: pool[0] ?? null };
}

export function pairKey(first: number, second: number) {
  return [first, second].sort((a, b) => a - b).join(":");
}

export function playoffSize(participantCount: number) {
  if (participantCount === 3) return 3;
  if (participantCount <= 6) return 4;
  if (participantCount <= 15) {
    return Math.min(8, 2 ** Math.floor(Math.log2(participantCount)));
  }
  if (participantCount <= 31) return 16;
  return 32;
}

export function bracketSize(qualifierCount: number) {
  return 2 ** Math.ceil(Math.log2(qualifierCount));
}

export function playoffStage(bracketCapacity: number, matchCount: number) {
  if (matchCount === 1) return "playoff_final";
  if (matchCount === 2) return "playoff_semifinal";
  if (matchCount === 4) return "playoff_quarterfinal";
  return `playoff_round_${bracketCapacity}`;
}

export function validateScore(
  player1Score: number,
  player2Score: number,
  targetScore: number,
) {
  return (
    Number.isInteger(player1Score) &&
    Number.isInteger(player2Score) &&
    player1Score >= 0 &&
    player2Score >= 0 &&
    ((player1Score === targetScore && player2Score < targetScore) ||
      (player2Score === targetScore && player1Score < targetScore))
  );
}

export function calculateStandings(
  participants: StandingParticipant[],
  matches: StandingMatch[],
  format: string | null,
) {
  const values = new Map(
    participants
      .filter(participant => participant.status === "approved")
      .map(participant => [
        participant.id,
        {
          participantId: participant.id,
          nickname: participant.nickname,
          played: 0,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          differential: 0,
          opponents: [] as number[],
        },
      ]),
  );

  for (const match of matches) {
    if (!match.player1Id || !match.player2Id) {
      const byeWinner = match.winnerId ? values.get(match.winnerId) : undefined;
      if (byeWinner) byeWinner.wins++;
      continue;
    }
    const first = values.get(match.player1Id);
    const second = values.get(match.player2Id);
    if (!first || !second) continue;
    first.played++;
    second.played++;
    first.pointsFor += match.player1Score ?? 0;
    first.pointsAgainst += match.player2Score ?? 0;
    second.pointsFor += match.player2Score ?? 0;
    second.pointsAgainst += match.player1Score ?? 0;
    first.opponents.push(second.participantId);
    second.opponents.push(first.participantId);
    if (match.winnerId === first.participantId) {
      first.wins++;
      second.losses++;
    } else if (match.winnerId === second.participantId) {
      second.wins++;
      first.losses++;
    }
  }

  for (const standing of values.values()) {
    standing.differential = standing.pointsFor - standing.pointsAgainst;
  }
  const list = [...values.values()];
  const wins = new Map(list.map(standing => [standing.participantId, standing.wins]));
  list.sort(
    (first, second) =>
      second.wins - first.wins ||
      (format === "swiss"
        ? second.opponents.reduce((sum, id) => sum + (wins.get(id) ?? 0), 0) -
          first.opponents.reduce((sum, id) => sum + (wins.get(id) ?? 0), 0)
        : 0) ||
      second.differential - first.differential ||
      second.pointsFor - first.pointsFor ||
      first.nickname.localeCompare(second.nickname),
  );

  return list.map(({ opponents: _opponents, ...standing }, index) => ({
    ...standing,
    rank: index + 1,
  }));
}