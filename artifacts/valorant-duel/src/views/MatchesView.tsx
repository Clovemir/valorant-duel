import { useState } from 'react';
import { Dices, SlidersHorizontal, X, Check } from 'lucide-react';
import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MatchDef, Player, PLAYERS, drawGroupMatches } from '@/lib/tournament';

type ManualRound = [Player, Player, Player, Player];

function toManualRounds(matches: MatchDef[]): ManualRound[] {
  if (matches.length !== 10) {
    const { matches: drawn } = drawGroupMatches();
    return toManualRounds(drawn);
  }
  return [1, 2, 3, 4, 5].map(round => {
    const roundMatches = matches.filter(match => match.round === round);
    return [roundMatches[0].p1, roundMatches[0].p2, roundMatches[1].p1, roundMatches[1].p2];
  });
}

export function MatchesView({ state }: { state: TournamentState }) {
  const { scores, updateScore, groupMatches, groupByes, drawFirstPhase, setManualFirstPhase } = state;
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isManualConfirmOpen, setIsManualConfirmOpen] = useState(false);
  const [manualRounds, setManualRounds] = useState<ManualRound[]>(() => toManualRounds(groupMatches));
  const [manualError, setManualError] = useState('');
  const [manualCandidate, setManualCandidate] = useState<{ matches: MatchDef[]; byes: Record<number, Player> } | null>(null);
  
  const rounds = [1, 2, 3, 4, 5];
  const hasResults = groupMatches.some(match => scores[match.id]);
  const isDrawn = groupMatches.length > 0;

  const handleDraw = () => {
    if (hasResults) {
      setIsDrawOpen(true);
      return;
    }
    drawFirstPhase();
  };

  const openManualEditor = () => {
    setManualRounds(toManualRounds(groupMatches));
    setManualError('');
    setIsManualOpen(true);
  };

  const updateManualPlayer = (roundIndex: number, slot: number, player: Player) => {
    setManualRounds(current => current.map((round, index) => {
      if (index !== roundIndex) return round;
      const next = [...round] as ManualRound;
      next[slot] = player;
      return next;
    }));
    setManualError('');
  };

  const saveManualSchedule = () => {
    const pairKeys = new Set<string>();
    const matches: MatchDef[] = [];
    const byes: Record<number, Player> = {};

    for (let index = 0; index < manualRounds.length; index++) {
      const selected = manualRounds[index];
      if (new Set(selected).size !== 4) {
        setManualError(`Na rodada ${index + 1}, cada jogador só pode aparecer uma vez.`);
        return;
      }
      const bye = PLAYERS.find(player => !selected.includes(player));
      if (!bye) {
        setManualError(`Não foi possível definir a folga da rodada ${index + 1}.`);
        return;
      }
      byes[index + 1] = bye;

      for (let pair = 0; pair < 2; pair++) {
        const p1 = selected[pair * 2];
        const p2 = selected[pair * 2 + 1];
        const key = [p1, p2].sort().join('|');
        if (pairKeys.has(key)) {
          setManualError(`O confronto ${p1} × ${p2} está repetido. Cada dupla deve jogar apenas uma vez.`);
          return;
        }
        pairKeys.add(key);
        matches.push({ id: `g${matches.length + 1}`, phase: 'group', round: index + 1, p1, p2, target: 15 });
      }
    }

    if (pairKeys.size !== 10) {
      setManualError('Todos os dez confrontos diferentes precisam estar presentes.');
      return;
    }

    if (hasResults) {
      setManualCandidate({ matches, byes });
      setIsManualConfirmOpen(true);
      return;
    }

    setManualFirstPhase(matches, byes);
    setIsManualOpen(false);
  };

  const isRoundComplete = (r: number) => {
    if (!isDrawn) return false;
    const roundMatches = groupMatches.filter(m => m.round === r);
    return roundMatches.every(m => scores[m.id]);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
         <div>
           <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Fase de Grupos</h2>
           <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato Round Robin</span>
         </div>
         <div className="flex flex-col gap-3 sm:flex-row">
           <button
             type="button"
             onClick={openManualEditor}
             className="flex items-center justify-center gap-2 border border-border bg-card px-5 py-3 font-display text-sm uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
           >
             <SlidersHorizontal size={16} />
             <span>Montar Manualmente</span>
           </button>
           <button
             type="button"
             onClick={handleDraw}
             className="val-clip-br flex items-center justify-center gap-2 bg-primary px-5 py-3 font-display text-sm uppercase tracking-widest text-primary-foreground transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
           >
             <Dices size={16} />
             <span>{isDrawn ? 'Sortear Novamente' : 'Sortear Confrontos'}</span>
           </button>
         </div>
      </div>
      
      {!isDrawn && (
         <div className="text-center p-12 border border-border bg-card/30 flex flex-col items-center animate-in fade-in duration-500">
           <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground border border-border">
             <Dices size={32} />
           </div>
           <h3 className="font-display text-2xl text-foreground uppercase tracking-wide mb-2">Tabela Vazia</h3>
           <p className="text-muted-foreground max-w-sm">Use os botões acima para sortear automaticamente os confrontos ou monte-os manualmente para iniciar o torneio.</p>
         </div>
      )}

      {isDrawn && rounds.map(r => {
        const complete = isRoundComplete(r);
        return (
          <div key={r} className={`p-5 md:p-6 border transition-all duration-300 relative ${complete ? 'bg-card/30 border-border/30 opacity-80' : 'bg-card border-border/80 shadow-sm'}`}>
            {complete && (
               <div className="absolute top-0 right-0 text-primary text-[10px] font-display uppercase tracking-widest flex items-center gap-1 border-l border-b border-primary/30 px-3 py-1 bg-primary/10">
                 <Check size={12} /> Concluída
               </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className={`font-display text-2xl uppercase tracking-wide ${complete ? 'text-muted-foreground' : 'text-primary'}`}>
                  Rodada {r}
                </h3>
              </div>
              
              {groupByes[r] && (
                 <div className={`flex items-center gap-2 text-sm px-4 py-2 border ${complete ? 'border-border/50 bg-background/50 text-muted-foreground' : 'border-border bg-background text-foreground'}`}>
                   <span className="font-display uppercase tracking-widest text-[10px] text-muted-foreground">Descanso:</span>
                   <span className="font-medium">{groupByes[r]}</span>
                 </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupMatches.filter(m => m.round === r).map(m => (
                 <MatchCard key={m.id} match={m} score={scores[m.id]} onSave={updateScore} />
               ))}
            </div>
          </div>
        );
      })}

      <ConfirmModal
        isOpen={isDrawOpen}
        onClose={() => setIsDrawOpen(false)}
        onConfirm={() => { drawFirstPhase(); setIsDrawOpen(false); }}
        title="Sortear Novos Confrontos"
        message="Atenção: Já existem resultados registrados. Um novo sorteio apagará TODOS os placares atuais e reiniciará o torneio. Tem certeza que deseja continuar?"
      />
      <ConfirmModal
        isOpen={isManualConfirmOpen}
        onClose={() => setIsManualConfirmOpen(false)}
        onConfirm={() => {
          if (manualCandidate) {
            setManualFirstPhase(manualCandidate.matches, manualCandidate.byes);
            setManualCandidate(null);
            setIsManualOpen(false);
          }
        }}
        title="Substituir Tabela Ativa"
        message="Atenção: Já existem resultados registrados. Salvar esta nova tabela apagará TODOS os placares atuais e reiniciará o torneio. Tem certeza que deseja continuar?"
      />

      {/* Manual Editor Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto border border-border bg-card p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wide text-primary">Montador de Tabela</h3>
                <p className="mt-1 text-sm text-muted-foreground">Defina os dois confrontos (quatro jogadores) para cada rodada. O quinto jogador folga automaticamente.</p>
              </div>
              <button type="button" onClick={() => setIsManualOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {manualRounds.map((round, roundIndex) => {
                const bye = PLAYERS.find(player => !round.includes(player));
                return (
                  <div key={roundIndex} className="border border-border bg-background/50 p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <span className="font-display text-lg uppercase tracking-widest text-primary">Rodada {roundIndex + 1}</span>
                      <span className="text-xs font-display uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 border border-border">
                        Folga: <strong className="text-foreground font-sans tracking-normal">{bye ?? 'Verifique as escolhas'}</strong>
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_24px_1fr_auto_1fr] md:items-center">
                      {round.map((player, slot) => (
                        <div key={slot} className={slot === 2 ? 'md:col-start-5' : ''}>
                          <label className="sr-only">Jogador {slot + 1} da rodada {roundIndex + 1}</label>
                          <select
                            value={player}
                            onChange={event => updateManualPlayer(roundIndex, slot, event.target.value as Player)}
                            className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                          >
                            {PLAYERS.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                      ))}
                      <span className="hidden font-display text-muted-foreground/50 md:col-start-2 md:row-start-1 md:block">VS</span>
                      <span className="hidden font-display text-muted-foreground/50 md:col-start-6 md:row-start-1 md:block">VS</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {manualError && (
              <div className="mt-6 border-l-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
                <X size={18} className="shrink-0 mt-0.5" />
                <p>{manualError}</p>
              </div>
            )}
            
            {hasResults && (
              <p className="mt-6 text-xs text-muted-foreground bg-muted p-3 border border-border">
                <strong className="text-foreground uppercase font-display tracking-widest block mb-1">Aviso de Sobrescrita</strong>
                Salvar uma nova tabela apagará permanentemente todos os resultados já registrados.
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-4 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsManualOpen(false)} className="border border-border px-6 py-3 font-display text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none">
                Cancelar
              </button>
              <button type="button" onClick={saveManualSchedule} className="val-clip-br bg-primary px-8 py-3 font-display text-xs uppercase tracking-widest text-primary-foreground hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center gap-2">
                <Check size={14} /> Salvar Tabela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
