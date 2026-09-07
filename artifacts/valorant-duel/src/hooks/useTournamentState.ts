import { useState, useEffect, useCallback } from 'react';
import { Player, MatchDef, MatchScore, drawGroupMatches, PLAYERS } from '@/lib/tournament';

export interface PlayerStats {
  name: Player;
  played: number;
  wins: number;
  losses: number;
  pf: number;
  pa: number;
  diff: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function useTournamentState() {
  const [groupMatches, setGroupMatches] = useState<MatchDef[]>(() => loadJSON('valorant_duel_schedule', []));
  const [scores, setScores] = useState<Record<string, MatchScore>>(() => loadJSON('valorant_duel_scores', {}));
  const [groupByes, setGroupByes] = useState<Record<number, Player>>(() => loadJSON('valorant_duel_byes', {}));
  const [logs, setLogs] = useState<LogEntry[]>(() => loadJSON('valorant_duel_logs', []));

  useEffect(() => { localStorage.setItem('valorant_duel_schedule', JSON.stringify(groupMatches)); }, [groupMatches]);
  useEffect(() => { localStorage.setItem('valorant_duel_scores', JSON.stringify(scores)); }, [scores]);
  useEffect(() => { localStorage.setItem('valorant_duel_byes', JSON.stringify(groupByes)); }, [groupByes]);
  useEffect(() => { localStorage.setItem('valorant_duel_logs', JSON.stringify(logs)); }, [logs]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => {
      const next = [{ id: Math.random().toString(36).substring(2, 9), timestamp: Date.now(), message }, ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const updateScore = useCallback((match: MatchDef, score: MatchScore | null) => {
    setScores(prev => {
      const next = { ...prev };
      if (score === null) {
        delete next[match.id];
      } else {
        next[match.id] = score;
      }
      
      if (score) {
        const winner = score.p1Score > score.p2Score ? match.p1 : match.p2;
        const loser = score.p1Score > score.p2Score ? match.p2 : match.p1;
        const scoreStr = score.p1Score > score.p2Score ? `${score.p1Score} a ${score.p2Score}` : `${score.p2Score} a ${score.p1Score}`;
        addLog(`${winner} venceu ${loser} por ${scoreStr}.`);
      } else {
        addLog(`Resultado de ${match.p1} vs ${match.p2} cancelado.`);
      }

      // Cascading deletes for upstream changes
      const isGroup = match.phase === 'group';
      if (isGroup) {
        delete next['playin']; delete next['uppersa']; delete next['uppersb'];
        delete next['upperfinal']; delete next['lowerround']; delete next['lowerfinal']; delete next['grandfinal'];
      } else if (match.id === 'playin') {
        delete next['uppersa']; delete next['upperfinal']; delete next['lowerround']; delete next['lowerfinal']; delete next['grandfinal'];
      } else if (match.id === 'uppersa' || match.id === 'uppersb') {
        delete next['upperfinal']; delete next['lowerround']; delete next['lowerfinal']; delete next['grandfinal'];
      } else if (match.id === 'upperfinal' || match.id === 'lowerround') {
        delete next['lowerfinal']; delete next['grandfinal'];
      } else if (match.id === 'lowerfinal') {
        delete next['grandfinal'];
      }
      return next;
    });
  }, [addLog]);

  const drawFirstPhase = useCallback(() => {
    const { matches, byes } = drawGroupMatches();
    setGroupMatches(matches);
    setGroupByes(byes);
    setScores({});
    addLog(`Sorteio da Fase de Grupos realizado.`);
  }, [addLog]);

  const setManualFirstPhase = useCallback((matches: MatchDef[], byes: Record<number, Player>) => {
    setGroupMatches(matches);
    setGroupByes(byes);
    setScores({});
    addLog('Confrontos da Fase de Grupos definidos manualmente.');
  }, [addLog]);

  const resetTournament = useCallback(() => {
    setScores({});
    setGroupMatches([]);
    setGroupByes({});
    setLogs([]);
  }, []);

  const stats: Record<string, PlayerStats> = {};
  PLAYERS.forEach(p => {
    stats[p] = { name: p, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 };
  });

  let groupCompletedCount = 0;

  groupMatches.forEach(m => {
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
    }
  });

  const rawStandings = Object.values(stats).filter(s => s.name !== 'A definir');
  const winGroups: Record<number, PlayerStats[]> = {};
  rawStandings.forEach(p => {
    if (!winGroups[p.wins]) winGroups[p.wins] = [];
    winGroups[p.wins].push(p);
  });
  
  const standings: PlayerStats[] = [];
  const winsDesc = Object.keys(winGroups).map(Number).sort((a,b) => b-a);
  
  for (const w of winsDesc) {
    const group = winGroups[w];
    if (group.length === 1) {
      standings.push(group[0]);
    } else if (group.length === 2) {
      group.sort((a, b) => {
        const h2hMatch = groupMatches.find(m => (m.p1 === a.name && m.p2 === b.name) || (m.p1 === b.name && m.p2 === a.name));
        if (h2hMatch && scores[h2hMatch.id]) {
          const s = scores[h2hMatch.id];
          const aScore = h2hMatch.p1 === a.name ? s.p1Score : s.p2Score;
          const bScore = h2hMatch.p1 === b.name ? s.p1Score : s.p2Score;
          if (aScore !== bScore) return bScore - aScore;
        }
        if (b.diff !== a.diff) return b.diff - a.diff;
        if (b.pf !== a.pf) return b.pf - a.pf;
        return a.name.localeCompare(b.name);
      });
      standings.push(...group);
    } else {
      group.sort((a, b) => {
        if (b.diff !== a.diff) return b.diff - a.diff;
        if (b.pf !== a.pf) return b.pf - a.pf;
        return a.name.localeCompare(b.name);
      });
      standings.push(...group);
    }
  }

  const groupComplete = groupCompletedCount === 10;
  const bracketMatches: MatchDef[] = [];
  
  const playinP1 = groupComplete ? standings[3].name : 'A definir';
  const playinP2 = groupComplete ? standings[4].name : 'A definir';
  bracketMatches.push({ id: 'playin', phase: 'playin', p1: playinP1, p2: playinP2, target: 20 });
  
  let playinWinner: Player = 'A definir';
  if (scores['playin'] && playinP1 !== 'A definir' && playinP2 !== 'A definir') {
    playinWinner = scores['playin'].p1Score === 20 ? playinP1 : playinP2;
  }

  const uppersaP1 = groupComplete ? standings[0].name : 'A definir';
  bracketMatches.push({ id: 'uppersa', phase: 'uppersa', p1: uppersaP1, p2: playinWinner, target: 25 });
  
  const uppersbP1 = groupComplete ? standings[1].name : 'A definir';
  const uppersbP2 = groupComplete ? standings[2].name : 'A definir';
  bracketMatches.push({ id: 'uppersb', phase: 'uppersb', p1: uppersbP1, p2: uppersbP2, target: 25 });

  let uppersaWinner: Player = 'A definir';
  let uppersaLoser: Player = 'A definir';
  if (scores['uppersa'] && uppersaP1 !== 'A definir' && playinWinner !== 'A definir') {
    uppersaWinner = scores['uppersa'].p1Score === 25 ? uppersaP1 : playinWinner;
    uppersaLoser = scores['uppersa'].p1Score === 25 ? playinWinner : uppersaP1;
  }

  let uppersbWinner: Player = 'A definir';
  let uppersbLoser: Player = 'A definir';
  if (scores['uppersb'] && uppersbP1 !== 'A definir' && uppersbP2 !== 'A definir') {
    uppersbWinner = scores['uppersb'].p1Score === 25 ? uppersbP1 : uppersbP2;
    uppersbLoser = scores['uppersb'].p1Score === 25 ? uppersbP2 : uppersbP1;
  }

  bracketMatches.push({ id: 'upperfinal', phase: 'upperfinal', p1: uppersaWinner, p2: uppersbWinner, target: 25 });
  bracketMatches.push({ id: 'lowerround', phase: 'lowerround', p1: uppersaLoser, p2: uppersbLoser, target: 25 });

  let upperfinalWinner: Player = 'A definir';
  let upperfinalLoser: Player = 'A definir';
  if (scores['upperfinal'] && uppersaWinner !== 'A definir' && uppersbWinner !== 'A definir') {
    upperfinalWinner = scores['upperfinal'].p1Score === 25 ? uppersaWinner : uppersbWinner;
    upperfinalLoser = scores['upperfinal'].p1Score === 25 ? uppersbWinner : uppersaWinner;
  }

  let lowerroundWinner: Player = 'A definir';
  if (scores['lowerround'] && uppersaLoser !== 'A definir' && uppersbLoser !== 'A definir') {
    lowerroundWinner = scores['lowerround'].p1Score === 25 ? uppersaLoser : uppersbLoser;
  }

  bracketMatches.push({ id: 'lowerfinal', phase: 'lowerfinal', p1: upperfinalLoser, p2: lowerroundWinner, target: 25 });

  let lowerfinalWinner: Player = 'A definir';
  if (scores['lowerfinal'] && upperfinalLoser !== 'A definir' && lowerroundWinner !== 'A definir') {
    lowerfinalWinner = scores['lowerfinal'].p1Score === 25 ? upperfinalLoser : lowerroundWinner;
  }

  bracketMatches.push({ id: 'grandfinal', phase: 'grandfinal', p1: upperfinalWinner, p2: lowerfinalWinner, target: 30 });

  let champion: Player | null = null;
  if (scores['grandfinal'] && upperfinalWinner !== 'A definir' && lowerfinalWinner !== 'A definir') {
    champion = scores['grandfinal'].p1Score === 30 ? upperfinalWinner : lowerfinalWinner;
  }

  const totalMatches = 17; // 10 group + 7 bracket
  const completedMatches = groupCompletedCount + Object.keys(scores).filter(k => k !== 'g1' && !k.startsWith('g')).length;
  const progress = Math.round((completedMatches / totalMatches) * 100);

  const allMatches = [...groupMatches, ...bracketMatches];
  const nextMatches = allMatches.filter(m => 
    m.p1 !== 'A definir' && 
    m.p2 !== 'A definir' && 
    !scores[m.id]
  );

  return {
    scores,
    groupMatches,
    groupByes,
    updateScore,
    drawFirstPhase,
    setManualFirstPhase,
    resetTournament,
    standings,
    bracketMatches,
    champion,
    progress,
    nextMatches,
    logs,
    clearLogs
  };
}

export type TournamentState = ReturnType<typeof useTournamentState>;
