import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { LogFeed } from '@/components/LogFeed';
import { Link } from 'wouter';
import { Dices, SlidersHorizontal, ArrowRight, Trophy } from 'lucide-react';

export function OverviewView({ state }: { state: TournamentState }) {
  const { progress, nextMatches, champion, logs, clearLogs, groupMatches, scores, bracketMatches } = state;
  const isStarted = groupMatches.length > 0;
  
  const completedCount = Object.keys(scores).length;
  const totalMatches = groupMatches.length + bracketMatches.length;

  let phase = "Não iniciado";
  if (champion) phase = "Concluído";
  else if (completedCount >= totalMatches) phase = "Finalizando";
  else if (completedCount >= 10) phase = "Playoffs";
  else if (isStarted) phase = "Fase de Grupos";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Visão Geral</h2>
        <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Painel do Torneio</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-center p-6 md:p-8 bg-card border border-border shadow-sm">
          <h3 className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-2">Fase Atual</h3>
          <div className="font-display text-4xl uppercase text-foreground mb-6">{phase}</div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-display">Progresso Geral</span>
              <span className="font-mono text-sm font-medium">{completedCount} / {totalMatches} Jogos</span>
            </div>
            <div className="w-full bg-background h-2 border border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-primary h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col justify-center p-6 md:p-8 bg-primary/10 border border-primary/30 val-clip-br shadow-[inset_0_0_40px_rgba(255,0,0,0.05)]">
          {champion ? (
            <div className="text-center animate-in zoom-in duration-700">
              <Trophy className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-display text-sm uppercase text-primary tracking-widest mb-1">Grande Campeão</h3>
              <div className="font-display text-3xl md:text-4xl uppercase text-foreground">{champion}</div>
            </div>
          ) : isStarted ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="font-display text-sm uppercase text-primary tracking-widest mb-3">Ação Recomendada</h3>
                {nextMatches.length > 0 ? (
                  <div className="flex flex-col gap-1 mb-6">
                    <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                      {nextMatches[0].phase === 'group' ? 'Próximo Grupo' : 'Próximo Playoff'}
                    </span>
                    <span className="text-foreground font-medium text-lg truncate">
                      {nextMatches[0].p1} <span className="text-muted-foreground text-sm mx-1 font-display">vs</span> {nextMatches[0].p2}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm block mb-6">Aguardando definição de resultados.</span>
                )}
              </div>
              <Link href="/matches" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 text-sm font-display uppercase tracking-widest hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                <span>Ir para Partidas</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="text-center flex flex-col h-full justify-center">
              <h3 className="font-display text-sm uppercase text-primary tracking-widest mb-6">Iniciar Torneio</h3>
              <div className="flex flex-col gap-3">
                <Link href="/matches" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 text-sm font-display uppercase tracking-widest hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                  <Dices size={16} /> <span>Sortear Grupos</span>
                </Link>
                <Link href="/matches" className="inline-flex items-center justify-center gap-2 bg-background border border-border text-foreground px-4 py-3 text-sm font-display uppercase tracking-widest hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                  <SlidersHorizontal size={16} /> <span>Montar Manualmente</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {isStarted && !champion && nextMatches.length > 0 && (
        <div className="animate-in fade-in duration-500 delay-150 fill-mode-both">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide mb-4 border-b border-border pb-2">Confrontos Pendentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nextMatches.slice(0, 4).map(m => (
              <div key={m.id}>
                <div className="text-[10px] font-display text-muted-foreground uppercase tracking-widest mb-2 border-l-2 border-primary/50 pl-2">
                  {m.phase === 'group' ? `Fase de Grupos — Rodada ${m.round}` : m.phase.includes('final') ? 'Finais' : 'Playoffs'}
                </div>
                {/* Editable directly from Overview to accelerate operations */}
                <MatchCard match={m} score={scores[m.id]} onSave={state.updateScore} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isStarted && (
        <div className="animate-in fade-in duration-500 delay-300 fill-mode-both">
          <LogFeed logs={logs} onClear={clearLogs} />
        </div>
      )}
    </div>
  );
}
