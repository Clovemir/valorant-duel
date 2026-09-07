import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';

export function BracketView({ state }: { state: TournamentState }) {
  const { bracketMatches, scores, updateScore, groupMatches } = state;
  const groupComplete = groupMatches.filter(m => scores[m.id]).length === 10;

  if (!groupComplete) {
     return (
       <div className="py-20 text-center border border-border bg-card/30">
         <h2 className="font-display text-2xl uppercase text-muted-foreground mb-2">Fase de Grupos Incompleta</h2>
         <p className="text-muted-foreground">Complete todos os jogos da fase de grupos para liberar o chaveamento definitivo.</p>
       </div>
     );
  }

  const getMatch = (id: string) => bracketMatches.find(m => m.id === id)!;

  return (
    <div className="space-y-10">
       <div>
         <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Chaveamento</h2>
         <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Playoffs de Eliminação Dupla</span>
       </div>
       
       <div className="overflow-x-auto pb-8 no-scrollbar">
         <div className="flex gap-8 min-w-[1200px]">
            {/* Column 1: Play-in */}
            <div className="w-72 flex flex-col gap-4">
              <h3 className="font-display text-sm text-muted-foreground uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Entrada</h3>
              <MatchCard match={getMatch('playin')} score={scores['playin']} onSave={updateScore} />
            </div>

            {/* Column 2: Upper Semis & Lower R1 */}
            <div className="w-72 flex flex-col justify-between gap-12">
              <div className="flex flex-col gap-4 relative">
                 <h3 className="font-display text-sm text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-2">Semifinais (Chave Superior)</h3>
                 <MatchCard match={getMatch('uppersa')} score={scores['uppersa']} onSave={updateScore} />
                 <MatchCard match={getMatch('uppersb')} score={scores['uppersb']} onSave={updateScore} />
              </div>
              <div className="flex flex-col gap-4">
                 <h3 className="font-display text-sm text-muted-foreground uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Rodada 1 (Chave Inferior)</h3>
                 <MatchCard match={getMatch('lowerround')} score={scores['lowerround']} onSave={updateScore} />
              </div>
            </div>

            {/* Column 3: Upper Final & Lower Final */}
            <div className="w-72 flex flex-col justify-between gap-12">
              <div className="flex flex-col gap-4 mt-[3.25rem]">
                 <h3 className="font-display text-sm text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-2">Final (Chave Superior)</h3>
                 <MatchCard match={getMatch('upperfinal')} score={scores['upperfinal']} onSave={updateScore} />
              </div>
              <div className="flex flex-col gap-4">
                 <h3 className="font-display text-sm text-muted-foreground uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Final (Chave Inferior)</h3>
                 <MatchCard match={getMatch('lowerfinal')} score={scores['lowerfinal']} onSave={updateScore} />
              </div>
            </div>

            {/* Column 4: Grand Final */}
            <div className="w-72 flex flex-col justify-center">
              <div className="flex flex-col gap-4">
                 <h3 className="font-display text-sm text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-2">Grande Final</h3>
                 <MatchCard match={getMatch('grandfinal')} score={scores['grandfinal']} onSave={updateScore} />
              </div>
            </div>
         </div>
       </div>
    </div>
  );
}
