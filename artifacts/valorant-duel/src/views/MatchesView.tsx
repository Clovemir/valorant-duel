import { useState } from 'react';
import { Dices } from 'lucide-react';
import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { ConfirmModal } from '@/components/ConfirmModal';

export function MatchesView({ state }: { state: TournamentState }) {
  const { scores, updateScore, groupMatches, drawFirstPhase } = state;
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const rounds = [1, 2, 3, 4, 5];
  const hasResults = groupMatches.some(match => scores[match.id]);

  const handleDraw = () => {
    if (hasResults) {
      setIsDrawOpen(true);
      return;
    }
    drawFirstPhase();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
         <div>
           <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Fase de Grupos</h2>
           <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato todos contra todos</span>
         </div>
         <button
           type="button"
           onClick={handleDraw}
           className="val-clip-br flex items-center justify-center gap-2 bg-primary px-5 py-3 font-display text-sm uppercase tracking-widest text-primary-foreground transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
         >
           <Dices size={18} />
           Sortear confrontos
         </button>
      </div>
      
      {rounds.map(r => (
        <div key={r} className="bg-card/30 p-4 md:p-6 border border-border/50">
          <h3 className="font-display text-xl text-primary mb-6 flex items-center gap-3 uppercase tracking-wide">
             <span className="bg-primary/20 text-primary px-3 py-1 val-clip-tl">Rodada {r}</span>
          </h3>
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
        onConfirm={drawFirstPhase}
        title="Sortear novos confrontos"
        message="Já existem resultados registrados. Um novo sorteio apagará todos os placares e reiniciará o chaveamento. Deseja continuar?"
      />
    </div>
  );
}
