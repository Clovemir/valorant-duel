import { TournamentState } from '@/hooks/useTournamentState';
import { GROUP_MATCHES } from '@/lib/tournament';
import { MatchCard } from '@/components/MatchCard';

export function MatchesView({ state }: { state: TournamentState }) {
  const { scores, updateScore } = state;
  const rounds = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-border pb-4">
         <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Fase de Grupos</h2>
         <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato Round Robin</span>
      </div>
      
      {rounds.map(r => (
        <div key={r} className="bg-card/30 p-4 md:p-6 border border-border/50">
          <h3 className="font-display text-xl text-primary mb-6 flex items-center gap-3 uppercase tracking-wide">
             <span className="bg-primary/20 text-primary px-3 py-1 val-clip-tl">Rodada {r}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
             {GROUP_MATCHES.filter(m => m.round === r).map(m => (
               <MatchCard key={m.id} match={m} score={scores[m.id]} onSave={updateScore} />
             ))}
          </div>
        </div>
      ))}
    </div>
  );
}
