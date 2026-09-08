import { TournamentMatch } from "@workspace/api-client-react";

const PLAYOFF_STAGES = [
  'playoff_round_32',
  'playoff_round_16',
  'playoff_quarterfinal',
  'playoff_semifinal',
  'playoff_final',
];

const STAGE_LABELS: Record<string, string> = {
  playoff_round_32: 'Rodada de 32',
  playoff_round_16: 'Oitavas',
  playoff_quarterfinal: 'Quartas',
  playoff_semifinal: 'Semifinais',
  playoff_final: 'Grande Final',
};

function BracketMatchCard({ match }: { match: TournamentMatch }) {
  const isP1Winner = match.player1Score !== null && match.player2Score !== null && match.player1Score > match.player2Score;
  const isP2Winner = match.player1Score !== null && match.player2Score !== null && match.player2Score > match.player1Score;

  return (
    <div className="bg-[#111115] border border-border/50 rounded-sm w-[240px] flex flex-col my-2 shadow-lg relative shrink-0">
      <div className="flex justify-between items-center px-3 py-1.5 border-b border-border/30">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Alvo: {match.targetScore} rounds</span>
      </div>
      
      <div className="flex flex-col py-1">
         <div className={`flex justify-between items-center px-3 py-2 border-l-2 transition-colors ${isP1Winner ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground'}`}>
            <span className={`font-display text-sm tracking-wider truncate mr-4 ${isP1Winner ? 'text-primary' : ''}`}>{match.player1Name || 'A DEFINIR'}</span>
            <span className={`font-mono text-base ${isP1Winner ? 'text-primary' : ''}`}>{match.player1Score ?? '-'}</span>
         </div>
         <div className={`flex justify-between items-center px-3 py-2 border-l-2 transition-colors ${isP2Winner ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground'}`}>
            <span className={`font-display text-sm tracking-wider truncate mr-4 ${isP2Winner ? 'text-primary' : ''}`}>{match.player2Name || 'A DEFINIR'}</span>
            <span className={`font-mono text-base ${isP2Winner ? 'text-primary' : ''}`}>{match.player2Score ?? '-'}</span>
         </div>
      </div>
    </div>
  );
}

export function TournamentBracket({ matches }: { matches: TournamentMatch[] }) {
  const playoffMatches = matches.filter(m => m.stage !== 'classification');
  
  if (playoffMatches.length === 0) {
    return (
      <div className="bg-card/30 border border-border p-16 text-center val-clip-tl text-muted-foreground font-mono">
        [ CHAVEAMENTO INDISPONÍVEL ]
      </div>
    );
  }

  const stagesPresent = PLAYOFF_STAGES.filter(stage => playoffMatches.some(m => m.stage === stage));

  return (
    <div className="w-full">
      {/* Desktop Bracket */}
      <div className="hidden md:flex gap-12 overflow-x-auto pb-12 pt-8 items-stretch no-scrollbar w-full">
        {stagesPresent.map((stage) => {
          const stageMatches = playoffMatches.filter(m => m.stage === stage).sort((a, b) => a.id - b.id);
          const isFinal = stage === 'playoff_final';
          
          return (
            <div key={stage} className="flex flex-col justify-around relative min-w-[240px]">
               <div className="absolute -top-8 left-0 w-full flex items-center">
                 <h4 className={`font-display text-xs tracking-widest uppercase ${isFinal ? 'text-primary' : 'text-primary/70'}`}>
                   {STAGE_LABELS[stage]}
                 </h4>
               </div>
               
               {stageMatches.map(m => <BracketMatchCard match={m} key={m.id} />)}
            </div>
          );
        })}
      </div>

      {/* Mobile Bracket */}
      <div className="flex md:hidden flex-col gap-8 py-4">
        {stagesPresent.map(stage => {
           const stageMatches = playoffMatches.filter(m => m.stage === stage).sort((a, b) => a.id - b.id);
           const isFinal = stage === 'playoff_final';
           
           return (
             <div key={stage} className="space-y-4">
               <div className="flex items-center gap-3">
                 <h4 className={`font-display text-sm tracking-widest uppercase ${isFinal ? 'text-primary' : 'text-primary/70'}`}>
                   {STAGE_LABELS[stage]}
                 </h4>
                 <div className="h-px bg-border/50 flex-1"></div>
               </div>
               <div className="flex flex-col gap-3 items-center">
                 {stageMatches.map(m => <BracketMatchCard match={m} key={m.id} />)}
               </div>
             </div>
           )
        })}
      </div>
    </div>
  );
}
