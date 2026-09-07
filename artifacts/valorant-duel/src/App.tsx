import { useState } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { RefreshCw, LayoutDashboard, Swords, ListOrdered, GitMerge, FileText } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

import { useTournamentState } from '@/hooks/useTournamentState';
import { OverviewView } from '@/views/OverviewView';
import { MatchesView } from '@/views/MatchesView';
import { StandingsView } from '@/views/StandingsView';
import { BracketView } from '@/views/BracketView';
import { RulesView } from '@/views/RulesView';
import { ConfirmModal } from '@/components/ConfirmModal';

const queryClient = new QueryClient();

function TournamentApp() {
  const [location, setLocation] = useLocation();
  const [isResetOpen, setIsResetOpen] = useState(false);
  
  const state = useTournamentState();
  
  const currentView = location === '/' ? 'overview' : location.slice(1);
  
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'matches', label: 'Partidas', icon: Swords },
    { id: 'standings', label: 'Classificação', icon: ListOrdered },
    { id: 'bracket', label: 'Chaveamento', icon: GitMerge },
    { id: 'rules', label: 'Regras', icon: FileText }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary val-clip-tl"></div>
             <h1 className="font-display text-2xl uppercase tracking-widest text-foreground mt-1">
               Valorant <span className="text-primary">Duel</span>
             </h1>
          </div>
          
          <button 
            onClick={() => setIsResetOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground border border-border hover:text-destructive hover:border-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-destructive"
            aria-label="Reiniciar torneio"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
        
        <div className="bg-card/50 border-t border-border overflow-x-auto no-scrollbar">
          <div className="max-w-6xl mx-auto flex px-4">
            {tabs.map(t => {
               const Icon = t.icon;
               return (
                 <button 
                   key={t.id} 
                   className={`flex items-center gap-2 px-6 py-4 font-display uppercase tracking-wider text-sm whitespace-nowrap border-b-2 transition-colors focus:outline-none focus-visible:bg-muted ${currentView === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}
                   onClick={() => setLocation(t.id === 'overview' ? '/' : `/${t.id}`)}
                 >
                   <Icon size={16} /> {t.label}
                 </button>
               );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <div className="animate-in fade-in duration-300">
          <Switch>
            <Route path="/" component={() => <OverviewView state={state} />} />
            <Route path="/overview" component={() => <OverviewView state={state} />} />
            <Route path="/matches" component={() => <MatchesView state={state} />} />
            <Route path="/standings" component={() => <StandingsView state={state} />} />
            <Route path="/bracket" component={() => <BracketView state={state} />} />
            <Route path="/rules" component={() => <RulesView />} />
            <Route>
               <div className="text-center py-20">
                  <h2 className="font-display text-4xl text-muted-foreground">Página não encontrada</h2>
               </div>
            </Route>
          </Switch>
        </div>
      </main>

      <ConfirmModal 
        isOpen={isResetOpen} 
        onClose={() => setIsResetOpen(false)} 
        onConfirm={state.resetTournament} 
        title="Reiniciar Torneio" 
        message="Tem certeza que deseja apagar todos os resultados? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <TournamentApp />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
