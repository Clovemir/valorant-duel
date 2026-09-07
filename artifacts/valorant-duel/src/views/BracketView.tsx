import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { Trophy } from 'lucide-react';

export function BracketView({ state }: { state: TournamentState }) {
  const { bracketMatches, scores, updateScore } = state;
  
  const rep = bracketMatches.find(m => m.id === 'rep')!;
  const semi1 = bracketMatches.find(m => m.id === 'semi1')!;
  const semi2 = bracketMatches.find(m => m.id === 'semi2')!;
  const third = bracketMatches.find(m => m.id === 'third')!;
  const final = bracketMatches.find(m => m.id === 'final')!;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-border pb-4">
         <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Chaveamento Final</h2>
         <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Eliminatória</span>
      </div>

      <div className="flex flex-col gap-12 overflow-x-auto pb-8">
        {/* Repechage Stage */}
        <div className="bg-card/40 p-6 border border-border/50">
          <h3 className="font-display text-xl text-primary mb-6 flex items-center gap-3 uppercase tracking-wide border-b border-border/50 pb-2">
            Repescagem <span className="text-xs text-muted-foreground tracking-widest">(4º vs 5º)</span>
          </h3>
          <div className="max-w-md">
            <MatchCard match={rep} score={scores.rep} onSave={updateScore} />
          </div>
        </div>

        {/* Semis & Finals Grid */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          <div className="flex-1 flex flex-col gap-12 justify-center">
            <div className="space-y-4">
              <h3 className="font-display text-xl text-muted-foreground uppercase tracking-widest">Semifinal 1</h3>
              <MatchCard match={semi1} score={scores.semi1} onSave={updateScore} />
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-xl text-muted-foreground uppercase tracking-widest">Semifinal 2</h3>
              <MatchCard match={semi2} score={scores.semi2} onSave={updateScore} />
            </div>
          </div>
          
          <div className="hidden md:flex flex-col justify-center items-center">
            <div className="w-16 h-px bg-border/50 absolute -translate-x-full"></div>
            <div className="h-48 w-px bg-border/50"></div>
            <div className="w-16 h-px bg-border/50 absolute translate-x-full"></div>
          </div>
          
          <div className="flex-1 flex flex-col gap-12 justify-center md:pl-0 border-t-2 md:border-t-0 pt-8 md:pt-0 border-border/50">
            <div className="bg-primary/5 p-6 border border-primary/20 relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground p-2 val-clip-tl translate-x-2 -translate-y-2">
                <Trophy size={16} />
              </div>
              <h3 className="font-display text-2xl text-primary mb-6 uppercase tracking-wide border-b border-primary/20 pb-2">
                Grande Final
              </h3>
              <MatchCard match={final} score={scores.final} onSave={updateScore} />
            </div>
            
            <div className="p-6 border border-border/50 bg-card/40">
              <h3 className="font-display text-xl text-muted-foreground mb-6 uppercase tracking-wide border-b border-border/50 pb-2">
                Disputa 3º Lugar
              </h3>
              <MatchCard match={third} score={scores.third} onSave={updateScore} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
