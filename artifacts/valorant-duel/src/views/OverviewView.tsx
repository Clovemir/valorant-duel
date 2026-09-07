import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { LogFeed } from '@/components/LogFeed';

export function OverviewView({ state }: { state: TournamentState }) {
  const { progress, nextMatches, champion, logs, clearLogs, groupMatches } = state;
  const isStarted = groupMatches.length > 0;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide mb-2">Visão Geral</h2>
        <div className="w-full bg-muted h-2 rounded-none overflow-hidden border border-border">
          <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-right font-mono text-sm text-muted-foreground">{progress}% Concluído</div>
      </div>

      {!isStarted && (
        <div className="bg-card border border-border p-8 text-center">
          <h3 className="font-display text-xl text-primary uppercase tracking-wide mb-2">Torneio não iniciado</h3>
          <p className="text-muted-foreground">Vá até a aba Partidas para sortear os confrontos iniciais.</p>
        </div>
      )}

      {champion && (
        <div className="bg-primary/10 border border-primary/30 p-8 text-center val-clip-br animate-in zoom-in duration-500">
          <h3 className="font-display text-xl text-primary uppercase tracking-wide mb-2">Campeão</h3>
          <div className="font-display text-5xl text-foreground uppercase tracking-wider">{champion}</div>
        </div>
      )}

      {isStarted && !champion && (
        <div>
          <h3 className="font-display text-xl text-muted-foreground uppercase tracking-wide mb-4 border-b border-border pb-2">Próximos Confrontos</h3>
          {nextMatches.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma partida pendente pronta para ser jogada no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextMatches.slice(0, 4).map(m => (
                <div key={m.id}>
                  <div className="text-xs font-display text-muted-foreground uppercase tracking-widest mb-2">
                    {m.phase === 'group' ? `Grupo - Rodada ${m.round}` : m.phase.includes('final') ? 'Finais' : 'Playoffs'}
                  </div>
                  <MatchCard match={m} onSave={state.updateScore} readOnly />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isStarted && <LogFeed logs={logs} onClear={clearLogs} />}
    </div>
  );
}
