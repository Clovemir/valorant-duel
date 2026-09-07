import { TournamentState } from '@/hooks/useTournamentState';

export function StandingsView({ state }: { state: TournamentState }) {
  const { standings, groupMatches } = state;
  const isStarted = groupMatches.length > 0;

  if (!isStarted) {
    return (
      <div className="text-center py-20 border border-border bg-card/30 animate-in fade-in zoom-in-95">
        <h2 className="font-display text-2xl uppercase text-muted-foreground mb-2">Sem classificação</h2>
        <p className="text-muted-foreground">Os confrontos ainda não foram sorteados e não há partidas registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Classificação</h2>
        <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Fase de Grupos</span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-border bg-muted/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
               <th className="p-4 font-normal w-12 text-center">Pos</th>
               <th className="p-4 font-normal">Jogador</th>
               <th className="p-4 font-normal text-center w-16">V</th>
               <th className="p-4 font-normal text-center w-16">D</th>
               <th className="p-4 font-normal text-center w-16">PF</th>
               <th className="p-4 font-normal text-center w-16">PS</th>
               <th className="p-4 font-normal text-center w-16">SD</th>
               <th className="p-4 font-normal text-center w-40">Status</th>
             </tr>
           </thead>
           <tbody>
             {standings.map((s, i) => {
                const seed = i + 1;
                let seedBadge = 'Eliminado';
                let rowBg = '';
                let badgeClass = 'text-muted-foreground';
                
                if (seed <= 3) {
                  seedBadge = 'Playoffs Direto';
                  rowBg = 'bg-primary/5';
                  badgeClass = 'text-primary bg-primary/10 border-primary/20';
                } else if (seed <= 5) {
                  seedBadge = 'Fase de Entrada';
                  badgeClass = 'text-foreground bg-muted border-border';
                }

                return (
                  <tr key={s.name} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${rowBg}`}>
                    <td className="p-4 font-mono text-muted-foreground text-center text-lg">{seed}</td>
                    <td className="p-4 font-semibold text-foreground">{s.name}</td>
                    <td className="p-4 text-center font-mono">{s.wins}</td>
                    <td className="p-4 text-center font-mono">{s.losses}</td>
                    <td className="p-4 text-center font-mono text-muted-foreground">{s.pf}</td>
                    <td className="p-4 text-center font-mono text-muted-foreground">{s.pa}</td>
                    <td className="p-4 text-center font-mono font-medium">{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-1 text-[10px] font-display uppercase tracking-widest border val-clip-tl ${badgeClass}`}>
                        {seedBadge}
                      </span>
                    </td>
                  </tr>
                );
             })}
           </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {standings.map((s, i) => {
          const seed = i + 1;
          let seedColor = 'border-border bg-card';
          let seedBadge = '';
          let badgeClass = '';
          
          if (seed <= 3) {
            seedColor = 'border-primary/40 bg-primary/5';
            seedBadge = 'Playoffs Direto';
            badgeClass = 'text-primary';
          } else if (seed <= 5) {
            seedColor = 'border-border bg-card';
            seedBadge = 'Fase de Entrada';
            badgeClass = 'text-muted-foreground';
          }

          return (
            <div key={s.name} className={`p-4 border ${seedColor} flex flex-col gap-4 relative overflow-hidden shadow-sm`}>
              {seed <= 3 && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
              
              <div className="flex justify-between items-center pl-1">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-2xl text-muted-foreground/80 w-6 text-center">{seed}</span>
                  <span className="font-semibold text-lg">{s.name}</span>
                </div>
                <span className="text-xs font-display uppercase tracking-widest bg-background px-3 py-1.5 border border-border font-medium">
                  {s.wins}V - {s.losses}D
                </span>
              </div>
              
              <div className="grid grid-cols-3 text-sm bg-background border border-border/50 divide-x divide-border/50">
                <div className="flex flex-col items-center py-2">
                  <span className="text-[10px] uppercase font-display text-muted-foreground tracking-widest mb-0.5">Saldo</span>
                  <span className={`font-mono font-medium ${s.diff > 0 ? 'text-primary' : s.diff < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {s.diff > 0 ? `+${s.diff}` : s.diff}
                  </span>
                </div>
                <div className="flex flex-col items-center py-2">
                  <span className="text-[10px] uppercase font-display text-muted-foreground tracking-widest mb-0.5">Pró (PF)</span>
                  <span className="font-mono">{s.pf}</span>
                </div>
                <div className="flex flex-col items-center py-2">
                  <span className="text-[10px] uppercase font-display text-muted-foreground tracking-widest mb-0.5">Contra (PS)</span>
                  <span className="font-mono">{s.pa}</span>
                </div>
              </div>
              
              <div className={`text-[10px] font-display uppercase tracking-widest flex items-center justify-center gap-1 ${badgeClass}`}>
                {seedBadge}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border p-5 text-sm text-muted-foreground relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-muted-foreground/30" />
        <h4 className="font-display uppercase text-foreground mb-3 tracking-widest pl-2 border-b border-border/50 pb-2">Critérios de Desempate</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li><strong className="text-foreground/80 font-normal">Maior número de Vitórias</strong></li>
          <li><strong className="text-foreground/80 font-normal">Confronto Direto</strong> (aplicado apenas em empates entre exatamente 2 jogadores)</li>
          <li><strong className="text-foreground/80 font-normal">Saldo de Pontos</strong> (SD)</li>
          <li><strong className="text-foreground/80 font-normal">Pontos Feitos</strong> (PF)</li>
          <li><strong className="text-foreground/80 font-normal">Ordem Alfabética</strong></li>
        </ol>
      </div>
    </div>
  );
}
