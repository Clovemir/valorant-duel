import { useState } from "react";
import { useLocation, useParams, useSearch, Link } from "wouter";
import { useGetTournament, useUpdateParticipant, useStartTournament, useUpdateTournamentMatch, getGetTournamentQueryKey, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, AlertCircle, Check, X, Play, Edit3, ArrowLeft, Save, ShieldAlert, Target, Copy, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TournamentBracket } from "@/components/TournamentBracket";

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${window.location.origin}${basePath}/t/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-mono px-2 py-1 border border-border/50 hover:border-border val-clip-tl bg-background/50" title="Copiar Link Público">
      {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      <span className={copied ? "text-accent" : ""}>{copied ? "COPIADO" : "LINK PÚBLICO"}</span>
    </button>
  );
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'registration': return 'Inscrições';
    case 'active': return 'Ativo';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

const getParticipantStatus = (status: string) => {
  switch (status) {
    case 'approved': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'rejected': return 'Rejeitado';
    default: return status;
  }
};

const getMatchStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'ready': return 'Pronto';
    case 'completed': return 'Finalizado';
    default: return status;
  }
};

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    classification: 'Classificatória',
    playoff_round_32: 'Playoffs — 32 avos',
    playoff_round_16: 'Playoffs — Oitavas',
    playoff_quarterfinal: 'Playoffs — Quartas',
    playoff_semifinal: 'Playoffs — Semifinal',
    playoff_final: 'Grande Final',
  };
  return labels[stage] ?? stage.replaceAll('_', ' ');
};

export function TournamentManageView() {
  const { slug } = useParams();
  const search = useSearch();
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(search);
  const { data: tournament, isLoading, error } = useGetTournament(slug || "");
  const updateParticipant = useUpdateParticipant();
  const startTournament = useStartTournament();
  const updateMatch = useUpdateTournamentMatch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const activeTab = searchParams.get("tab") === "matches" ? "matches" : "participants";
  const manageMatchSubTab = searchParams.get("view") === "bracket" ? "bracket" : "edit";
  const editPhase = searchParams.get("phase") === "playoffs" ? "playoffs" : "classification";
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [matchScores, setMatchScores] = useState<{p1: string, p2: string}>({ p1: "0", p2: "0" });

  const updateNavigation = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    Object.entries(updates).forEach(([key, value]) => value === null ? next.delete(key) : next.set(key, value));
    navigate(`/t/${slug}/manage${next.size ? `?${next.toString()}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
          <Target className="text-primary animate-pulse" size={32} />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <ShieldAlert className="text-destructive" size={48} />
        <h2 className="font-display uppercase tracking-widest text-3xl">Falha de Autorização</h2>
      </div>
    );
  }

  if (!tournament.isOrganizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <div className="w-24 h-24 bg-destructive/10 border border-destructive/50 flex items-center justify-center val-clip-tl">
          <ShieldAlert className="text-destructive" size={48} />
        </div>
        <h2 className="font-display uppercase tracking-widest text-3xl text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground font-sans">Apenas o organizador pode acessar o painel de controle.</p>
        <Link href={`/t/${slug}`} className="mt-4 bg-card border border-border px-8 py-4 font-display uppercase tracking-widest val-clip-br hover:border-primary/50 transition-colors">
          Retornar à Base
        </Link>
      </div>
    );
  }

  const handleParticipantStatus = (participantId: number, status: 'approved' | 'rejected') => {
    if (!slug) return;
    const selected = tournament.participants.find(participant => participant.id === participantId);
    if (status === 'rejected' && !window.confirm(`Rejeitar a inscrição de ${selected?.nickname ?? "este participante"}?`)) return;
    updateParticipant.mutate(
      { slug, participantId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          toast({ title: "Status Atualizado", description: "O sistema registrou a alteração do agente." });
        },
        onError: () => toast({ title: "Falha", description: "Erro ao comunicar com o servidor.", variant: "destructive" })
      }
    );
  };

  const handleStartTournament = () => {
    if (!slug) return;
    const format = approvedCount <= 6 ? "todos contra todos" : "sistema suíço";
    if (!window.confirm(`Iniciar o torneio com ${approvedCount} participantes no formato ${format}? Após o início, o elenco ficará bloqueado.`)) return;
    startTournament.mutate(
      { slug },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
          toast({ title: "Operação Iniciada", description: "Formato alocado. Matriz de confrontos gerada." });
          updateNavigation({ tab: "matches", view: "edit", phase: "classification", round: "1" });
        },
        onError: (err: any) => toast({ title: "Falha Crítica", description: err?.message, variant: "destructive" })
      }
    );
  };

  const handleSaveMatch = (matchId: number) => {
    if (!slug) return;
    const p1 = parseInt(matchScores.p1, 10);
    const p2 = parseInt(matchScores.p2, 10);
    
    if (isNaN(p1) || isNaN(p2) || p1 < 0 || p2 < 0) {
      toast({ title: "Erro de Validação", description: "As pontuações devem ser números inteiros e positivos.", variant: "destructive" });
      return;
    }

    updateMatch.mutate(
      { slug, matchId, data: { player1Score: p1, player2Score: p2 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          toast({ title: "Placar Registrado", description: "Resultados sincronizados com a tabela." });
          setEditingMatch(null);
        },
        onError: () => toast({ title: "Erro de Sincronização", description: "Não foi possível salvar o placar.", variant: "destructive" })
      }
    );
  };

  const approvedCount = tournament.participants.filter(p => p.status === 'approved').length;
  const canStart = tournament.status === 'registration' && approvedCount >= 3;
  const hasPlayoffMatches = tournament.matches.some(match => match.stage !== "classification");
  const editableMatches = tournament.matches.filter(match => editPhase === "classification" ? match.stage === "classification" : match.stage !== "classification");
  const matchRounds = [...new Set(editableMatches.map(match => match.round))].sort((a, b) => a - b);
  const defaultRound = matchRounds.find(round => editableMatches.some(match => match.round === round && match.status !== "completed")) ?? matchRounds.at(-1) ?? 1;
  const requestedRound = Number(searchParams.get("round"));
  const selectedRound = matchRounds.includes(requestedRound) ? requestedRound : defaultRound;
  const selectedRoundIndex = matchRounds.indexOf(selectedRound);
  const selectedRoundMatches = editableMatches.filter(match => match.round === selectedRound);
  const completedMatches = tournament.matches.filter(match => match.status === "completed").length;
  const pendingApprovals = tournament.participants.filter(participant => participant.status === "pending").length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-border relative">
        <div className="corner-tl absolute top-0 left-0 w-8 h-8 pointer-events-none"></div>
        <div className="flex items-start gap-4">
          <Link href={`/t/${slug}`} className="group w-12 h-12 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors val-clip-tl shrink-0 mt-2">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className={`text-[10px] px-2 py-1 font-mono uppercase tracking-widest border ${
                 tournament.status === 'registration' ? 'bg-primary/10 text-primary border-primary/30' :
                 tournament.status === 'active' ? 'bg-accent/10 text-accent border-accent/30' :
                 'bg-muted text-muted-foreground border-border'
               }`}>
                 {getStatusLabel(tournament.status)}
               </span>
               <CopyLinkButton slug={tournament.slug} />
            </div>
            <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-foreground line-clamp-2 md:line-clamp-1">{tournament.name}</h2>
            <p className="text-muted-foreground font-sans mt-1 text-sm">Controle de Operações da Administração</p>
          </div>
        </div>
        {canStart && (
          <Button 
            onClick={handleStartTournament}
            disabled={startTournament.isPending}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-widest val-clip-br h-14 px-8 rounded-none text-lg transition-all"
          >
            {startTournament.isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
            Autorizar Início
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="manage-progress-summary">
        {[
          { label: "Pendentes", value: String(pendingApprovals) },
          { label: "Aprovados", value: String(approvedCount) },
          { label: "Rodada atual", value: matchRounds.length ? `${selectedRound}/${matchRounds.length}` : "—" },
          { label: "Resultados", value: `${completedMatches}/${tournament.matches.length}` },
        ].map(item => (
          <div key={item.label} className="bg-card/60 border border-border p-4 val-clip-tl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="font-display text-2xl uppercase tracking-wider text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex overflow-x-auto no-scrollbar border-b border-border/50 gap-2">
        <button
          onClick={() => updateNavigation({ tab: "participants", view: null, round: null })}
          data-testid="tab-manage-participants"
          className={`flex items-center gap-2 px-8 py-4 font-display uppercase tracking-widest text-sm whitespace-nowrap transition-all val-clip-tl relative ${
            activeTab === 'participants'
              ? 'bg-muted/50 text-foreground border-t-2 border-primary' 
              : 'bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground border-t-2 border-transparent'
          }`}
        >
          Esquadrão ({tournament.participants.length})
        </button>
        <button
          onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: editPhase, round: String(selectedRound) })}
          data-testid="tab-manage-matches"
          className={`flex items-center gap-2 px-8 py-4 font-display uppercase tracking-widest text-sm whitespace-nowrap transition-all val-clip-tl relative ${
            activeTab === 'matches'
              ? 'bg-muted/50 text-foreground border-t-2 border-primary' 
              : 'bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground border-t-2 border-transparent'
          }`}
        >
          Resultados e Chaves
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'participants' && (
          <div className="space-y-8">
            <div className="bg-background border-l-2 border-accent p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="font-sans text-sm text-foreground">
                <strong className="text-accent font-mono text-lg">{approvedCount}</strong> agentes aprovados no momento. Mínimo de 3 requisitado para inicialização.
              </span>
              {tournament.maxParticipants && (
                <span className="font-mono text-xs text-muted-foreground bg-card px-3 py-1.5 border border-border">
                  Capacidade: {tournament.maxParticipants}
                </span>
              )}
            </div>

            <div className="bg-card border border-border val-clip-tl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead className="bg-background border-b border-border font-mono uppercase tracking-widest text-xs text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Agente</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ação de Comando</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {tournament.participants.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-mono">
                          [ NENHUM REGISTRO ENCONTRADO ]
                        </td>
                      </tr>
                    ) : (
                      tournament.participants.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-5 font-display text-xl tracking-wider">{p.nickname}</td>
                          <td className="px-6 py-5">
                            <span className={`text-[10px] px-2 py-1 font-mono uppercase tracking-widest border inline-block ${
                              p.status === 'approved' ? 'border-accent/50 text-accent bg-accent/10' :
                              p.status === 'pending' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 
                              'border-destructive/50 text-destructive bg-destructive/10'
                            }`}>
                              {getParticipantStatus(p.status)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {tournament.status === 'registration' && (
                              <div className="flex justify-end gap-3">
                                {p.status !== 'approved' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-9 rounded-none border-accent/50 text-accent hover:bg-accent/10 hover:text-accent font-display uppercase tracking-widest text-xs"
                                    onClick={() => handleParticipantStatus(p.id, 'approved')}
                                    disabled={updateParticipant.isPending}
                                  >
                                    <Check size={14} className="mr-1.5" /> Aprovar
                                  </Button>
                                )}
                                {p.status !== 'rejected' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-9 rounded-none border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive font-display uppercase tracking-widest text-xs"
                                    onClick={() => handleParticipantStatus(p.id, 'rejected')}
                                    disabled={updateParticipant.isPending}
                                  >
                                    <X size={14} className="mr-1.5" /> Rejeitar
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8">
            {tournament.status === 'registration' ? (
              <div className="bg-card/30 border border-border p-16 text-center val-clip-br text-muted-foreground">
                <ShieldAlert className="mx-auto mb-6 opacity-50" size={48} />
                <h3 className="font-display uppercase tracking-widest text-2xl text-foreground mb-2">Operação Não Iniciada</h3>
                <p className="font-sans max-w-md mx-auto">Aprove o esquadrão necessário e clique em "Autorizar Início" para que a inteligência central aloque os confrontos.</p>
              </div>
            ) : tournament.matches.length === 0 ? (
               <div className="bg-card/30 border border-border p-16 text-center val-clip-tl text-muted-foreground font-mono">
                 [ NENHUM CONFRONTO ENCONTRADO NO BANCO DE DADOS ]
               </div>
            ) : (
              <div className="space-y-6">
                {tournament.matches.some(m => m.stage !== 'classification') && (
                  <div className="flex gap-2 border-b border-border/30 pb-4 mb-6">
                    <button onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: editPhase, round: String(selectedRound) })} data-testid="subtab-manage-edit" className={`px-4 py-2 font-display text-sm tracking-widest uppercase val-clip-tl transition-all border ${manageMatchSubTab === 'edit' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-transparent text-muted-foreground border-transparent hover:border-border'}`}>Lista de Edição</button>
                    <button onClick={() => updateNavigation({ tab: "matches", view: "bracket", phase: null, round: null })} data-testid="subtab-manage-bracket" className={`px-4 py-2 font-display text-sm tracking-widest uppercase val-clip-tl transition-all border ${manageMatchSubTab === 'bracket' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-transparent text-muted-foreground border-transparent hover:border-border'}`}>Visualizar Chaveamento</button>
                  </div>
                )}

                {manageMatchSubTab === 'bracket' && tournament.matches.some(m => m.stage !== 'classification') ? (
                  <TournamentBracket matches={tournament.matches} />
                ) : (
                  <div className="space-y-6">
                    {matchRounds.length > 0 ? (
                      <>
                        {hasPlayoffMatches && (
                          <div className="flex gap-2" aria-label="Fase para edição">
                            <button onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: "classification", round: "1" })} data-testid="filter-manage-classification" className={`px-4 py-2 border font-display uppercase tracking-widest text-xs ${editPhase === "classification" ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>Classificatória</button>
                            <button onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: "playoffs", round: "1" })} data-testid="filter-manage-playoffs" className={`px-4 py-2 border font-display uppercase tracking-widest text-xs ${editPhase === "playoffs" ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>Playoffs</button>
                          </div>
                        )}
                        <div className="bg-card/50 border border-border p-3 sm:p-4 flex items-center justify-between gap-3 val-clip-br">
                          <Button variant="outline" disabled={selectedRoundIndex <= 0} onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: editPhase, round: String(matchRounds[selectedRoundIndex - 1]) })} className="rounded-none" data-testid="button-manage-previous-round">
                            <ChevronLeft size={16} className="sm:mr-2" /><span className="hidden sm:inline">Anterior</span>
                          </Button>
                          <div className="text-center">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Edição — {editPhase === "classification" ? "classificatória" : "playoffs"}</p>
                            <p className="font-display text-xl uppercase tracking-widest">Rodada {selectedRound} <span className="text-primary">/ {matchRounds.length}</span></p>
                          </div>
                          <Button variant="outline" disabled={selectedRoundIndex >= matchRounds.length - 1} onClick={() => updateNavigation({ tab: "matches", view: "edit", phase: editPhase, round: String(matchRounds[selectedRoundIndex + 1]) })} className="rounded-none" data-testid="button-manage-next-round">
                            <span className="hidden sm:inline">Próxima</span><ChevronRight size={16} className="sm:ml-2" />
                          </Button>
                        </div>
                        <div className="space-y-6">
                       <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <h4 className="font-display uppercase tracking-widest text-2xl text-foreground">Rodada <span className="text-primary">{String(selectedRound).padStart(2, '0')}</span></h4>
                         <span className="shrink-0 border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                            Meta: {selectedRoundMatches[0]?.targetScore ?? 0} rounds
                         </span>
                         <div className="h-px min-w-12 bg-border/50 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedRoundMatches.map(match => (
                            <div key={match.id} className="bg-card border border-border flex flex-col val-clip-tl relative overflow-hidden group">
                               {match.status === 'completed' && <div className="absolute top-0 right-0 w-1.5 h-full bg-muted"></div>}
                               {match.status === 'ready' && <div className="absolute top-0 right-0 w-1.5 h-full bg-accent"></div>}
                               
                               <div className="p-6 flex flex-col gap-5">
                                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                    <span>{getStageLabel(match.stage)}</span>
                                    <span className={match.status === 'ready' ? 'text-accent' : ''}>{getMatchStatus(match.status)}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-y border-border/40 bg-background/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                                    <span className="text-muted-foreground">Condição de vitória</span>
                                    <strong className="text-primary">Chegar a {match.targetScore} rounds</strong>
                                  </div>
                                  
                                  {editingMatch === match.id ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4 p-3 bg-background border border-border/50">
                                        <span className="font-display text-lg tracking-wider flex-1 truncate">{match.player1Name || 'A DEFINIR'}</span>
                                        <Input 
                                          type="number" 
                                          className="w-20 bg-card border-border font-mono text-center rounded-none text-xl" 
                                          value={matchScores.p1}
                                          onChange={(e) => setMatchScores(prev => ({...prev, p1: e.target.value}))}
                                          disabled={!match.player1Id}
                                        />
                                      </div>
                                      <div className="flex items-center gap-4 p-3 bg-background border border-border/50">
                                        <span className="font-display text-lg tracking-wider flex-1 truncate">{match.player2Name || 'A DEFINIR'}</span>
                                        <Input 
                                          type="number" 
                                          className="w-20 bg-card border-border font-mono text-center rounded-none text-xl" 
                                          value={matchScores.p2}
                                          onChange={(e) => setMatchScores(prev => ({...prev, p2: e.target.value}))}
                                          disabled={!match.player2Id}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                        <Button variant="ghost" size="sm" className="rounded-none font-display uppercase tracking-widest text-xs h-10 px-6 hover:bg-muted" onClick={() => setEditingMatch(null)}>Abortar</Button>
                                        <Button 
                                          size="sm" 
                                          className="rounded-none font-display uppercase tracking-widest text-xs h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 val-clip-br" 
                                          onClick={() => handleSaveMatch(match.id)}
                                          disabled={updateMatch.isPending}
                                        >
                                          {updateMatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Confirmar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className={`flex justify-between items-center p-3 border-l-2 ${match.player1Score && match.player2Score && match.player1Score > match.player2Score ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-background text-muted-foreground'}`}>
                                        <span className="font-display text-lg tracking-wider truncate mr-4">{match.player1Name || 'A DEFINIR'}</span>
                                        <span className="font-mono text-xl">{match.player1Score ?? '-'}</span>
                                      </div>
                                      <div className={`flex justify-between items-center p-3 border-l-2 ${match.player1Score && match.player2Score && match.player2Score > match.player1Score ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-background text-muted-foreground'}`}>
                                        <span className="font-display text-lg tracking-wider truncate mr-4">{match.player2Name || 'A DEFINIR'}</span>
                                        <span className="font-mono text-xl">{match.player2Score ?? '-'}</span>
                                      </div>
                                      
                                      {(match.player1Id || match.player2Id) && (
                                        <div className="flex justify-end pt-4 mt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-9 rounded-none border-border font-display uppercase text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted"
                                            onClick={() => {
                                              setMatchScores({
                                                p1: match.player1Score?.toString() || "0",
                                                p2: match.player2Score?.toString() || "0"
                                              });
                                              setEditingMatch(match.id);
                                            }}
                                          >
                                            <Edit3 size={14} className="mr-2" /> Editar Placar
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                               </div>
                            </div>
                          ))}
                        </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-card/30 border border-border p-12 text-center val-clip-tl">
                        <Activity className="mx-auto mb-4 text-muted-foreground" size={36} />
                        <h4 className="font-display uppercase tracking-widest text-xl">Nenhuma rodada disponível</h4>
                        <p className="text-muted-foreground mt-2">{editPhase === "playoffs" ? "Os playoffs serão disponibilizados após a conclusão da classificatória." : "Aprove pelo menos três participantes e autorize o início para gerar os confrontos."}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}