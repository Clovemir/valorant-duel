import { TournamentState } from '@/hooks/useTournamentState';

export function StandingsView({ state }: { state: TournamentState }) {
  const { standings, groupMatches } = state;
  const isStarted = groupMatches.length > 0;

  if (!isStarted) {
    return (
      <div className="text-center py-20 border border-border bg-card/30">
        <h2 className="font-display text-2xl uppercase text-muted-foreground mb-2">Sem classificação</h2>
        <p className="text-muted-foreground">Os confrontos ainda não foram sorteados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Classificação</h2>
        <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Fase de Grupos</span>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
           <thead>
             <tr className="border-b border-border bg-muted/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
               <th className="p-4 font-normal w-12 text-center">Pos</th>
               <th className="p-4 font-normal">Jogador</th>
               <th className="p-4 font-normal text-center w-16">V</th>
               <th className="p-4 font-normal text-center w-16">D</th>
               <th className="p-4 font-normal text-center w-16 hidden sm:table-cell">PF</th>
               <th className="p-4 font-normal text-center w-16 hidden sm:table-cell">PS</th>
               <th className="p-4 font-normal text-center w-16">SD</th>
               <th className="p-4 font-normal text-center w-32">Seed</th>
             </tr>
           </thead>
           <tbody>
             {standings.map((s, i) => {
                const seed = i + 1;
                let seedText = '';
                let seedColor = '';
                if (seed === 1) { seedText = 'Seed 1 (Semi Sup)'; seedColor = 'text-primary'; }
                else if (seed === 2 || seed === 3) { seedText = `Seed ${seed} (Semi Sup)`; seedColor = 'text-primary'; }
                else if (seed === 4 || seed === 5) { seedText = `Seed ${seed} (Entrada)`; seedColor = 'text-muted-foreground'; }

                return (
                  <tr key={s.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono text-muted-foreground text-center">{seed}°</td>
                    <td className="p-4 font-semibold">{s.name}</td>
                    <td className="p-4 text-center font-mono">{s.wins}</td>
                    <td className="p-4 text-center font-mono">{s.losses}</td>
                    <td className="p-4 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.pf}</td>
                    <td className="p-4 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.pa}</td>
                    <td className="p-4 text-center font-mono font-medium">{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
                    <td className={`p-4 text-center text-xs font-display uppercase tracking-wider ${seedColor}`}>{seedText}</td>
                  </tr>
                );
             })}
           </tbody>
        </table>
      </div>

      <div className="bg-card/50 border border-border/50 p-4 text-sm text-muted-foreground">
        <h4 className="font-display uppercase text-foreground mb-2 tracking-widest">Critérios de Desempate</h4>
        <ol className="list-decimal list-inside space-y-1 ml-1">
          <li>Maior número de Vitórias</li>
          <li>Confronto Direto (aplicado apenas em empates entre exatamente 2 jogadores)</li>
          <li>Saldo de Pontos (SD)</li>
          <li>Pontos Feitos (PF)</li>
          <li>Ordem alfabética do nome do jogador</li>
        </ol>
      </div>
    </div>
  );
}
