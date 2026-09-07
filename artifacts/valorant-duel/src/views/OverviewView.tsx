import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { Trophy } from 'lucide-react';

export function OverviewView({ state }: { state: TournamentState }) {
  const { champion, progress, nextMatches, scores, updateScore } = state;

  return (
    <div className="space-y-10">
      {champion && (
         <div className="bg-primary text-primary-foreground p-10 text-center val-clip-tl shadow-lg animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
              <Trophy size={200} />
           </div>
           <h2 className="font-display text-3xl mb-1 tracking-widest uppercase opacity-90">Grande Campeão</h2>
           <p className="font-display text-7xl font-bold uppercase tracking-wider">{champion}</p>
         </div>
      )}

      <div className="bg-card border border-border p-6 md:p-8 shadow-sm">
         <div className="flex justify-between items-end mb-4">
           <h3 className="font-display text-2xl tracking-wide uppercase">Progresso do Torneio</h3>
           <span className="font-display text-3xl text-primary">{progress}%</span>
         </div>
         <div className="h-3 bg-muted w-full overflow-hidden val-clip-br">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
         </div>
      </div>

      {nextMatches.length > 0 && (
         <div>
           <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
             <h3 className="font-display text-2xl text-primary uppercase tracking-wide">Próximas Partidas Pendentes</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {nextMatches.slice(0, 4).map(m => (
                <MatchCard key={m.id} match={m} score={scores[m.id]} onSave={updateScore} />
             ))}
           </div>
           {nextMatches.length === 0 && (
              <p className="text-muted-foreground italic">Todas as partidas pendentes foram concluídas.</p>
           )}
         </div>
      )}
    </div>
  );
}
