import { useState, useEffect, useCallback } from 'react';
import { Player, MatchDef, MatchScore, GROUP_MATCHES } from '@/lib/tournament';

export interface PlayerStats {
  name: Player;
  played: number;
  wins: number;
  losses: number;
  pf: number;
  pa: number;
  diff: number;
  winRate: number;
}

export function useTournamentState() {
  const [scores, setScores] = useState<Record<string, MatchScore>>(() => {
    try {
      const saved = localStorage.getItem('valorant_duel_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('valorant_duel_scores', JSON.stringify(scores));
  }, [scores]);

  const updateScore = useCallback((id: string, score: MatchScore | null) => {
    setScores(prev => {
      const next = { ...prev };
      if (score === null) {
        delete next[id];
      } else {
        next[id] = score;
      }
      
      // Cascading deletes for upstream changes to ensure validity of bracket matches
      if (GROUP_MATCHES.find(m => m.id === id)) {
        delete next['rep'];
        delete next['semi1'];
        delete next['semi2'];
        delete next['third'];
        delete next['final'];
      } else if (id === 'rep') {
        delete next['semi1'];
        delete next['final'];
        delete next['third'];
      } else if (id === 'semi1' || id === 'semi2') {
        delete next['final'];
        delete next['third'];
      }
      return next;
    });
  }, []);

  const resetTournament = useCallback(() => {
    setScores({});
  }, []);

  const stats: Record<string, PlayerStats> = {};
  const PLAYERS: Player[] = ['Gol Bolinha', '0rochi', 'Solluty', 'Bufalo Bill', 'Christian'];
  PLAYERS.forEach(p => {
    stats[p] = { name: p, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0, winRate: 0 };
  });

  let groupCompletedCount = 0;

  GROUP_MATCHES.forEach(m => {
    const s = scores[m.id];
    if (s) {
      groupCompletedCount++;
      const p1 = stats[m.p1];
      const p2 = stats[m.p2];
      p1.played++; p2.played++;
      p1.pf += s.p1Score; p2.pf += s.p2Score;
      p1.pa += s.p2Score; p2.pa += s.p1Score;
      p1.diff = p1.pf - p1.pa;
      p2.diff = p2.pf - p2.pa;
      if (s.p1Score > s.p2Score) {
        p1.wins++; p2.losses++;
      } else {
        p2.wins++; p1.losses++;
      }
      p1.winRate = (p1.wins / p1.played) * 100;
      p2.winRate = (p2.wins / p2.played) * 100;
    }
  });

  const standings = Object.values(stats).filter(s => s.name !== 'A definir').sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.diff !== a.diff) return b.diff - a.diff;
    // Head to head
    const h2hMatch = GROUP_MATCHES.find(m => (m.p1 === a.name && m.p2 === b.name) || (m.p1 === b.name && m.p2 === a.name));
    if (h2hMatch && scores[h2hMatch.id]) {
       const score = scores[h2hMatch.id];
       const aScore = h2hMatch.p1 === a.name ? score.p1Score : score.p2Score;
       const bScore = h2hMatch.p1 === b.name ? score.p1Score : score.p2Score;
       if (aScore !== bScore) return bScore - aScore;
    }
    return b.pf - a.pf;
  });

  const groupComplete = groupCompletedCount === 10;

  const bracketMatches: MatchDef[] = [];
  
  const repP1 = groupComplete ? standings[3].name : 'A definir';
  const repP2 = groupComplete ? standings[4].name : 'A definir';
  bracketMatches.push({ id: 'rep', phase: 'repechage', p1: repP1, p2: repP2, target: 20 });
  
  let repWinner: Player = 'A definir';
  if (scores['rep'] && repP1 !== 'A definir' && repP2 !== 'A definir') {
    repWinner = scores['rep'].p1Score === 20 ? repP1 : repP2;
  }

  const semi1P1 = groupComplete ? standings[0].name : 'A definir';
  bracketMatches.push({ id: 'semi1', phase: 'semi', p1: semi1P1, p2: repWinner, target: 25 });
  
  const semi2P1 = groupComplete ? standings[1].name : 'A definir';
  const semi2P2 = groupComplete ? standings[2].name : 'A definir';
  bracketMatches.push({ id: 'semi2', phase: 'semi', p1: semi2P1, p2: semi2P2, target: 25 });

  let semi1Winner: Player = 'A definir';
  let semi1Loser: Player = 'A definir';
  if (scores['semi1'] && semi1P1 !== 'A definir' && repWinner !== 'A definir') {
    semi1Winner = scores['semi1'].p1Score === 25 ? semi1P1 : repWinner;
    semi1Loser = scores['semi1'].p1Score === 25 ? repWinner : semi1P1;
  }

  let semi2Winner: Player = 'A definir';
  let semi2Loser: Player = 'A definir';
  if (scores['semi2'] && semi2P1 !== 'A definir' && semi2P2 !== 'A definir') {
    semi2Winner = scores['semi2'].p1Score === 25 ? semi2P1 : semi2P2;
    semi2Loser = scores['semi2'].p1Score === 25 ? semi2P2 : semi2P1;
  }

  bracketMatches.push({ id: 'final', phase: 'final', p1: semi1Winner, p2: semi2Winner, target: 30 });
  bracketMatches.push({ id: 'third', phase: 'third', p1: semi1Loser, p2: semi2Loser, target: 20 });

  let champion: Player | null = null;
  if (scores['final'] && semi1Winner !== 'A definir' && semi2Winner !== 'A definir') {
    champion = scores['final'].p1Score === 30 ? semi1Winner : semi2Winner;
  }

  const totalMatches = 15;
  const completedMatches = groupCompletedCount + (scores['rep'] ? 1 : 0) + (scores['semi1'] ? 1 : 0) + (scores['semi2'] ? 1 : 0) + (scores['third'] ? 1 : 0) + (scores['final'] ? 1 : 0);
  const progress = Math.round((completedMatches / totalMatches) * 100);

  const allMatches = [...GROUP_MATCHES, ...bracketMatches];
  const nextMatches = allMatches.filter(m => 
    m.p1 !== 'A definir' && 
    m.p2 !== 'A definir' && 
    !scores[m.id]
  );

  return {
    scores,
    updateScore,
    resetTournament,
    standings,
    bracketMatches,
    champion,
    progress,
    nextMatches
  };
}

export type TournamentState = ReturnType<typeof useTournamentState>;
