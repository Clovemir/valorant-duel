import { TournamentState } from '@/hooks/useTournamentState';

export function StandingsView({ state }: { state: TournamentState }) {
  const { standings } = state;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-4">
         <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Classificação</h2>
         <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Fase de Grupos</span>
      </div>

      <div className="overflow-x-auto border border-border bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase font-display tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 font-normal">Pos</th>
              <th className="px-6 py-4 font-normal">Jogador</th>
              <th className="px-4 py-4 font-normal text-center">J</th>
              <th className="px-4 py-4 font-normal text-center">V</th>
              <th className="px-4 py-4 font-normal text-center">D</th>
              <th className="px-4 py-4 font-normal text-center">PF</th>
              <th className="px-4 py-4 font-normal text-center">PS</th>
              <th className="px-4 py-4 font-normal text-center">Saldo</th>
              <th className="px-6 py-4 font-normal text-center">% Vit</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const isQualified = i < 3;
              const isRepechage = i === 3 || i === 4;
              
              return (
                <tr 
                  key={s.name} 
                  className={`border-t border-border hover:bg-muted/30 transition-colors ${i === 0 ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-6 py-4 font-display text-lg">
                    {i + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{s.name}</span>
                      <span className="text-[10px] uppercase font-display tracking-widest mt-1">
                        {isQualified ? <span className="text-primary">Qualificado (Semi)</span> : isRepechage ? <span className="text-yellow-500">Repescagem</span> : <span className="text-muted-foreground">Eliminado</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-muted-foreground">{s.played}</td>
                  <td className="px-4 py-4 text-center font-bold text-green-500">{s.wins}</td>
                  <td className="px-4 py-4 text-center font-bold text-red-500">{s.losses}</td>
                  <td className="px-4 py-4 text-center text-muted-foreground">{s.pf}</td>
                  <td className="px-4 py-4 text-center text-muted-foreground">{s.pa}</td>
                  <td className={`px-4 py-4 text-center font-bold font-display text-lg ${s.diff > 0 ? 'text-green-500' : s.diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {s.diff > 0 ? `+${s.diff}` : s.diff}
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {s.played > 0 ? s.winRate.toFixed(0) : 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
