import { useState, useRef, useEffect } from 'react';
import { Maximize, Minimize, Map as MapIcon, Layers, Lock, Swords } from 'lucide-react';
import { TournamentState } from '@/hooks/useTournamentState';
import { MatchCard } from '@/components/MatchCard';
import { Link } from 'wouter';

export function BracketView({ state }: { state: TournamentState }) {
  const { bracketMatches, scores, updateScore, groupMatches } = state;
  const groupCompletedCount = groupMatches.filter(m => scores[m.id]).length;
  const groupComplete = groupCompletedCount === 10;
  
  const [viewMode, setViewMode] = useState<'map' | 'stage'>('stage');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setViewMode('map');
    }
    
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!groupComplete) {
     return (
       <div className="space-y-6 max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-500">
         <div className="text-center p-8 md:p-12 border border-border bg-card/30 flex flex-col items-center shadow-lg relative overflow-hidden">
           <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
             <Lock size={200} />
           </div>
           
           <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground border border-border">
             <Lock size={28} />
           </div>
           
           <h2 className="font-display text-2xl md:text-3xl uppercase text-foreground tracking-wide mb-2">Chaveamento Bloqueado</h2>
           <p className="text-muted-foreground mb-8 max-w-md">A fase de grupos está em andamento (<span className="text-foreground font-mono">{groupCompletedCount}/10</span> concluídos). Complete todos os jogos para liberar o chaveamento definitivo.</p>
           
           <div className="w-full max-w-sm bg-background/80 border border-border p-5 mb-8 text-left backdrop-blur-sm relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
             <h3 className="font-display text-sm uppercase text-primary tracking-widest mb-4 border-b border-border/50 pb-2 pl-3">Zonas de Classificação</h3>
             <ul className="space-y-4 pl-3">
               <li className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">1º ao 3º Colocado</span>
                 <span className="font-medium text-foreground bg-primary/20 border border-primary/30 text-primary px-2.5 py-1 text-xs uppercase tracking-wider font-display val-clip-tl">Playoffs Direto</span>
               </li>
               <li className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">4º e 5º Colocado</span>
                 <span className="font-medium text-foreground bg-muted border border-border px-2.5 py-1 text-xs uppercase tracking-wider font-display val-clip-tl">Fase de Entrada</span>
               </li>
             </ul>
           </div>
           
           <Link href="/matches" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 font-display uppercase tracking-widest hover:brightness-110 transition val-clip-br focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
             <Swords size={18} />
             <span>Ir para Partidas</span>
           </Link>
         </div>
       </div>
     );
  }

  const getMatch = (id: string) => bracketMatches.find(m => m.id === id)!;

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && mapRef.current) {
      try {
        await mapRef.current.requestFullscreen();
      } catch (e) {
        console.error(e);
      }
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div ref={mapRef} className={`space-y-8 flex flex-col ${isFullscreen ? 'bg-background p-6 md:p-10 overflow-y-auto h-screen w-screen' : ''}`}>
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border pb-4">
         <div>
           <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Chaveamento</h2>
           <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Eliminação Dupla</span>
         </div>
         <div className="flex bg-card border border-border p-1">
           <button 
             onClick={() => setViewMode('stage')} 
             className={`flex items-center gap-2 px-3 py-2 text-xs font-display uppercase tracking-widest transition-colors ${viewMode === 'stage' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
             aria-label="Ver por Etapas"
           >
             <Layers size={14} /> Etapas
           </button>
           <button 
             onClick={() => setViewMode('map')} 
             className={`flex items-center gap-2 px-3 py-2 text-xs font-display uppercase tracking-widest transition-colors ${viewMode === 'map' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
             aria-label="Ver Mapa Completo"
           >
             <MapIcon size={14} /> Mapa
           </button>
           {viewMode === 'map' && (
             <button 
               onClick={toggleFullscreen} 
               className="flex items-center gap-2 px-3 py-2 border-l border-border text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
               aria-label={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
             >
               {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
             </button>
           )}
         </div>
       </div>
       
       {viewMode === 'map' ? (
         <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-10">
           <div className="min-w-[768px] grid grid-cols-4 gap-x-6 gap-y-12">
              {/* Play-in */}
              <div className="col-start-1 row-start-2 flex flex-col justify-center relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2 px-1">Fase de Entrada</h3>
                <MatchCard compact match={getMatch('playin')} score={scores['playin']} onSave={updateScore} p1Label="Seed 4" p2Label="Seed 5" />
              </div>

              {/* Upper Semi A */}
              <div className="col-start-2 row-start-1 flex flex-col justify-end relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-primary mb-2 px-1">Semi Superior A</h3>
                <MatchCard compact match={getMatch('uppersa')} score={scores['uppersa']} onSave={updateScore} p1Label="Seed 1" p2Label="Venc. Entrada" />
              </div>

              {/* Upper Semi B */}
              <div className="col-start-2 row-start-2 flex flex-col justify-center relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-primary mb-2 px-1">Semi Superior B</h3>
                <MatchCard compact match={getMatch('uppersb')} score={scores['uppersb']} onSave={updateScore} p1Label="Seed 2" p2Label="Seed 3" />
              </div>

              {/* Lower R1 */}
              <div className="col-start-2 row-start-3 flex flex-col justify-start relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2 px-1">Rodada 1 Inferior</h3>
                <MatchCard compact match={getMatch('lowerround')} score={scores['lowerround']} onSave={updateScore} p1Label="Perdedor Semi A" p2Label="Perdedor Semi B" />
              </div>

              {/* Upper Final */}
              <div className="col-start-3 row-start-1 row-span-2 flex flex-col justify-center relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-primary mb-2 px-1">Final Superior</h3>
                <MatchCard compact match={getMatch('upperfinal')} score={scores['upperfinal']} onSave={updateScore} p1Label="Venc. Semi A" p2Label="Venc. Semi B" />
              </div>

              {/* Lower Final */}
              <div className="col-start-3 row-start-3 flex flex-col justify-center relative">
                <h3 className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2 px-1">Final Inferior</h3>
                <MatchCard compact match={getMatch('lowerfinal')} score={scores['lowerfinal']} onSave={updateScore} p1Label="Perdedor Final Sup." p2Label="Venc. R1 Inf." />
              </div>

              {/* Grand Final */}
              <div className="col-start-4 row-start-1 row-span-3 flex flex-col justify-center relative">
                <div className="absolute -left-6 top-1/2 w-6 h-px bg-primary/30 hidden md:block"></div>
                <h3 className="text-[12px] font-display uppercase tracking-widest text-primary mb-2 px-1">Grande Final</h3>
                <MatchCard match={getMatch('grandfinal')} score={scores['grandfinal']} onSave={updateScore} p1Label="Venc. Final Sup." p2Label="Venc. Final Inf." />
              </div>
           </div>
         </div>
       ) : (
         <div className="flex flex-col gap-10 max-w-xl mx-auto w-full pb-10">
           <div className="space-y-4">
             <h3 className="font-display text-lg text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Fase de Entrada</h3>
             <MatchCard match={getMatch('playin')} score={scores['playin']} onSave={updateScore} p1Label="Seed 4" p2Label="Seed 5" />
           </div>

           <div className="space-y-4">
             <h3 className="font-display text-lg text-primary uppercase tracking-widest border-b border-primary/30 pb-2">Semifinais Superiores</h3>
             <div className="grid gap-4">
               <MatchCard match={getMatch('uppersa')} score={scores['uppersa']} onSave={updateScore} p1Label="Seed 1" p2Label="Vencedor da Entrada" />
               <MatchCard match={getMatch('uppersb')} score={scores['uppersb']} onSave={updateScore} p1Label="Seed 2" p2Label="Seed 3" />
             </div>
           </div>

           <div className="space-y-4">
             <h3 className="font-display text-lg text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Rodada 1 Inferior</h3>
             <MatchCard match={getMatch('lowerround')} score={scores['lowerround']} onSave={updateScore} p1Label="Perdedor da Semi A" p2Label="Perdedor da Semi B" />
           </div>

           <div className="space-y-4">
             <h3 className="font-display text-lg text-primary uppercase tracking-widest border-b border-primary/30 pb-2">Final Superior</h3>
             <MatchCard match={getMatch('upperfinal')} score={scores['upperfinal']} onSave={updateScore} p1Label="Vencedor da Semi A" p2Label="Vencedor da Semi B" />
           </div>

           <div className="space-y-4">
             <h3 className="font-display text-lg text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Final Inferior</h3>
             <MatchCard match={getMatch('lowerfinal')} score={scores['lowerfinal']} onSave={updateScore} p1Label="Perdedor da Final Sup." p2Label="Vencedor da R1 Inf." />
           </div>

           <div className="space-y-4 mt-4">
             <h3 className="font-display text-2xl text-primary uppercase tracking-wide border-b border-primary pb-2">Grande Final</h3>
             <MatchCard match={getMatch('grandfinal')} score={scores['grandfinal']} onSave={updateScore} p1Label="Vencedor da Final Sup." p2Label="Vencedor da Final Inf." />
           </div>
         </div>
       )}
    </div>
  );
}
