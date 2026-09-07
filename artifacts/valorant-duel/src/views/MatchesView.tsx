import { useState } from 'react';
import { Dices, SlidersHorizontal, X } from 'lucide-react';
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

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
         <div>
           <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Fase de Grupos</h2>
           <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato todos contra todos</span>
         </div>
         <div className="flex flex-col gap-2 sm:flex-row">
           <button
             type="button"
             onClick={openManualEditor}
             className="flex items-center justify-center gap-2 border border-border bg-card px-5 py-3 font-display text-sm uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
           >
             <SlidersHorizontal size={18} />
             Montar manualmente
           </button>
           <button
             type="button"
             onClick={handleDraw}
             className="val-clip-br flex items-center justify-center gap-2 bg-primary px-5 py-3 font-display text-sm uppercase tracking-widest text-primary-foreground transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
           >
             <Dices size={18} />
             {isDrawn ? 'Sortear Novamente' : 'Sortear Confrontos'}
           </button>
         </div>
      </div>
      
      {!isDrawn && (
         <div className="text-center py-20 border border-border bg-card/30">
           <h3 className="font-display text-xl text-muted-foreground uppercase tracking-wide mb-2">Confrontos não definidos</h3>
           <p className="text-muted-foreground">Sorteie automaticamente ou monte os confrontos manualmente usando os botões acima.</p>
         </div>
      )}

      {isDrawn && rounds.map(r => (
        <div key={r} className="bg-card/30 p-4 md:p-6 border border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <h3 className="font-display text-xl text-primary flex items-center gap-3 uppercase tracking-wide">
               <span className="bg-primary/20 text-primary px-3 py-1 val-clip-tl">Rodada {r}</span>
            </h3>
            {groupByes[r] && (
               <span className="text-sm font-display text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 border border-border">
                 Folga: <span className="text-foreground">{groupByes[r]}</span>
               </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {groupMatches.filter(m => m.round === r).map(m => (
               <MatchCard key={m.id} match={m} score={scores[m.id]} onSave={updateScore} />
             ))}
          </div>
        </div>
      ))}
      <ConfirmModal
        isOpen={isDrawOpen}
        onClose={() => setIsDrawOpen(false)}
        onConfirm={() => { drawFirstPhase(); setIsDrawOpen(false); }}
        title="Sortear novos confrontos"
        message="Já existem resultados registrados. Um novo sorteio apagará todos os placares e reiniciará o chaveamento. Deseja continuar?"
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
        title="Salvar novos confrontos"
        message="Esta alteração apagará todos os resultados registrados e reiniciará o chaveamento. Deseja continuar?"
      />
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-3 backdrop-blur-sm">
          <div className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto border border-border bg-card p-5 shadow-2xl md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wide text-primary">Montar confrontos</h3>
                <p className="mt-1 text-sm text-muted-foreground">Escolha quatro jogadores por rodada. O quinto recebe a folga automaticamente.</p>
              </div>
              <button type="button" onClick={() => setIsManualOpen(false)} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {manualRounds.map((round, roundIndex) => {
                const bye = PLAYERS.find(player => !round.includes(player));
                return (
                  <div key={roundIndex} className="border border-border bg-background/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-display uppercase tracking-widest text-primary">Rodada {roundIndex + 1}</span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Folga: <strong className="text-foreground">{bye ?? 'Verifique as escolhas'}</strong></span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_24px_1fr_auto_1fr] md:items-center">
                      {round.map((player, slot) => (
                        <div key={slot} className={slot === 2 ? 'md:col-start-5' : ''}>
                          <label className="sr-only">Jogador {slot + 1} da rodada {roundIndex + 1}</label>
                          <select
                            value={player}
                            onChange={event => updateManualPlayer(roundIndex, slot, event.target.value as Player)}
                            className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                          >
                            {PLAYERS.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                      ))}
                      <span className="hidden font-display text-muted-foreground md:col-start-2 md:row-start-1 md:block">×</span>
                      <span className="hidden font-display text-muted-foreground md:col-start-6 md:row-start-1 md:block">×</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {manualError && <p role="alert" className="mt-4 border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{manualError}</p>}
            {hasResults && <p className="mt-4 text-xs text-muted-foreground">Atenção: salvar uma nova tabela apagará os resultados existentes e reiniciará o chaveamento.</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsManualOpen(false)} className="border border-border px-5 py-2.5 font-display text-xs uppercase tracking-widest hover:bg-muted">Cancelar</button>
              <button type="button" onClick={saveManualSchedule} className="val-clip-br bg-primary px-6 py-2.5 font-display text-xs uppercase tracking-widest text-primary-foreground hover:brightness-110">Salvar confrontos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
