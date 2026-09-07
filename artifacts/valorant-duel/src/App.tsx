import { useState, useRef } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { RefreshCw, LayoutDashboard, Swords, ListOrdered, GitMerge, FileText, Download, Upload } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const state = useTournamentState();
  const currentView = location === '/' ? 'overview' : location.slice(1);
  
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'matches', label: 'Partidas', icon: Swords },
    { id: 'standings', label: 'Classificação', icon: ListOrdered },
    { id: 'bracket', label: 'Chaveamento', icon: GitMerge },
    { id: 'rules', label: 'Regras', icon: FileText }
  ];

  const handleExport = () => {
    const data = {
      schedule: localStorage.getItem('valorant_duel_schedule'),
      scores: localStorage.getItem('valorant_duel_scores'),
      byes: localStorage.getItem('valorant_duel_byes'),
      logs: localStorage.getItem('valorant_duel_logs')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valorant_duel_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
         const data = JSON.parse(event.target?.result as string);
         if (data.schedule) localStorage.setItem('valorant_duel_schedule', data.schedule);
         if (data.scores) localStorage.setItem('valorant_duel_scores', data.scores);
         if (data.byes) localStorage.setItem('valorant_duel_byes', data.byes);
         if (data.logs) localStorage.setItem('valorant_duel_logs', data.logs);
         window.location.reload();
      } catch {
         alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  };

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
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground border border-border hover:text-foreground hover:border-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary hidden sm:flex"
              aria-label="Restaurar backup"
            >
              <Upload size={14} /> Restaurar
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground border border-border hover:text-foreground hover:border-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary hidden sm:flex"
              aria-label="Baixar backup"
            >
              <Download size={14} /> Backup
            </button>
            <button 
              onClick={() => setIsResetOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground border border-border hover:text-destructive hover:border-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-destructive"
              aria-label="Reiniciar torneio"
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
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
        message="Tem certeza que deseja apagar todos os resultados e a tabela atual? Esta ação não pode ser desfeita e todas as informações armazenadas localmente serão perdidas."
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
