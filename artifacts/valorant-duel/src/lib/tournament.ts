export type Player = 'Gol Bolinha' | '0rochi' | 'Solluty' | 'Bufalo Bill' | 'Christian' | 'A definir';
export type MatchPhase = 'group' | 'playin' | 'uppersa' | 'uppersb' | 'upperfinal' | 'lowerround' | 'lowerfinal' | 'grandfinal';

export interface MatchDef {
  id: string;
  phase: MatchPhase;
  round?: number;
  p1: Player;
  p2: Player;
  target: number;
}

export interface MatchScore {
  p1Score: number;
  p2Score: number;
}

export const PLAYERS: Player[] = ['Gol Bolinha', '0rochi', 'Solluty', 'Bufalo Bill', 'Christian'];

export function drawGroupMatches(): { matches: MatchDef[], byes: Record<number, Player> } {
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5);
  const matches: MatchDef[] = [];
  const byes: Record<number, Player> = {};
  let matchIndex = 1;

  for (let round = 1; round <= 5; round++) {
    const bye = shuffled[4];
    byes[round] = bye;

    const m1 = [shuffled[0], shuffled[3]];
    const m2 = [shuffled[1], shuffled[2]];

    // Randomize sides
    if (Math.random() > 0.5) m1.reverse();
    if (Math.random() > 0.5) m2.reverse();

    matches.push({ id: `g${matchIndex++}`, phase: 'group', round, p1: m1[0] as Player, p2: m1[1] as Player, target: 15 });
    matches.push({ id: `g${matchIndex++}`, phase: 'group', round, p1: m2[0] as Player, p2: m2[1] as Player, target: 15 });

    // Rotate right: 4 becomes 0
    shuffled.unshift(shuffled.pop()!);
  }

  return { matches, byes };
}

export function validateScore(p1Score: number, p2Score: number, target: number): string | null {
  if (isNaN(p1Score) || isNaN(p2Score)) return "Insira números válidos.";
  if (p1Score < 0 || p2Score < 0 || p1Score % 1 !== 0 || p2Score % 1 !== 0) return "A pontuação deve ser um número inteiro positivo.";
  if (p1Score === p2Score) return "Não pode haver empate.";
  if (p1Score !== target && p2Score !== target) return `Um jogador deve atingir exatamente ${target} pontos.`;
  if (p1Score > target || p2Score > target) return `A pontuação não pode ultrapassar o alvo de ${target}.`;
  return null;
}
