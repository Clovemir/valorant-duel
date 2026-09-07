export type Player = 'Gol Bolinha' | '0rochi' | 'Solluty' | 'Bufalo Bill' | 'Christian' | 'A definir';
export type MatchPhase = 'group' | 'repechage' | 'semi' | 'third' | 'final';

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

export const GROUP_MATCHES: MatchDef[] = [
  { id: 'g1', phase: 'group', round: 1, p1: '0rochi', p2: 'Christian', target: 15 },
  { id: 'g2', phase: 'group', round: 1, p1: 'Solluty', p2: 'Bufalo Bill', target: 15 },
  { id: 'g3', phase: 'group', round: 2, p1: 'Gol Bolinha', p2: 'Christian', target: 15 },
  { id: 'g4', phase: 'group', round: 2, p1: '0rochi', p2: 'Solluty', target: 15 },
  { id: 'g5', phase: 'group', round: 3, p1: 'Gol Bolinha', p2: 'Bufalo Bill', target: 15 },
  { id: 'g6', phase: 'group', round: 3, p1: 'Christian', p2: 'Solluty', target: 15 },
  { id: 'g7', phase: 'group', round: 4, p1: 'Gol Bolinha', p2: 'Solluty', target: 15 },
  { id: 'g8', phase: 'group', round: 4, p1: 'Bufalo Bill', p2: '0rochi', target: 15 },
  { id: 'g9', phase: 'group', round: 5, p1: 'Gol Bolinha', p2: '0rochi', target: 15 },
  { id: 'g10', phase: 'group', round: 5, p1: 'Bufalo Bill', p2: 'Christian', target: 15 },
];

export function drawGroupMatches(): MatchDef[] {
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5);
  const rotation: Array<Player | null> = [...shuffled, null];
  const matches: MatchDef[] = [];
  let matchIndex = 1;

  for (let round = 1; round <= 5; round++) {
    for (let pair = 0; pair < 3; pair++) {
      const first = rotation[pair];
      const second = rotation[rotation.length - 1 - pair];

      if (first && second) {
        const swapSides = Math.random() > 0.5;
        matches.push({
          id: `g${matchIndex}`,
          phase: 'group',
          round,
          p1: swapSides ? second : first,
          p2: swapSides ? first : second,
          target: 15,
        });
        matchIndex++;
      }
    }

    rotation.splice(1, 0, rotation.pop()!);
  }

  return matches;
}

export function validateScore(p1Score: number, p2Score: number, target: number): string | null {
  if (isNaN(p1Score) || isNaN(p2Score)) return "Insira números válidos.";
  if (p1Score < 0 || p2Score < 0) return "A pontuação não pode ser negativa.";
  if (p1Score === p2Score) return "Não pode haver empate.";
  if (p1Score !== target && p2Score !== target) return `Um jogador deve atingir ${target} pontos.`;
  if (p1Score > target || p2Score > target) return `A pontuação máxima é ${target}.`;
  return null;
}
