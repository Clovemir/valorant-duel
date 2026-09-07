import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetTournament, useUpdateParticipant, useStartTournament, useUpdateTournamentMatch, getGetTournamentQueryKey, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, AlertCircle, Check, X, Play, Edit3, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    case 'completed': return 'Concluído';
    default: return status;
  }
};

export function TournamentManageView() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { data: tournament, isLoading, error } = useGetTournament(slug || "");
  const updateParticipant = useUpdateParticipant();
  const startTournament = useStartTournament();
  const updateMatch = useUpdateTournamentMatch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'participants' | 'matches'>('participants');
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [matchScores, setMatchScores] = useState<{p1: string, p2: string}>({ p1: "0", p2: "0" });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="text-destructive" size={48} />
        <h2 className="font-display uppercase tracking-widest text-2xl">Torneio Não Encontrado</h2>
      </div>
    );
  }

  // Double check authorization (if somehow they reached here without being organizer, though the server shouldn't return `isOrganizer` true)
  if (!tournament.isOrganizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Shield className="text-destructive" size={48} />
        <h2 className="font-display uppercase tracking-widest text-2xl">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não é o organizador deste evento.</p>
        <Link href={`/t/${slug}`} className="mt-4 text-primary font-display uppercase tracking-widest">Voltar ao Torneio</Link>
      </div>
    );
  }

  const handleParticipantStatus = (participantId: number, status: 'approved' | 'rejected') => {
    if (!slug) return;
    updateParticipant.mutate(
      { slug, participantId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          toast({ title: "Participante atualizado" });
        },
        onError: () => toast({ title: "Falha na atualização", variant: "destructive" })
      }
    );
  };

  const handleStartTournament = () => {
    if (!slug) return;
    startTournament.mutate(
      { slug },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
          toast({ title: "Torneio iniciado!", description: "Formato gerado e partidas criadas." });
          setActiveTab('matches');
        },
        onError: (err: any) => toast({ title: "Falha ao iniciar", description: err?.message, variant: "destructive" })
      }
    );
  };

  const handleSaveMatch = (matchId: number) => {
    if (!slug) return;
    const p1 = parseInt(matchScores.p1, 10);
    const p2 = parseInt(matchScores.p2, 10);
    
    if (isNaN(p1) || isNaN(p2) || p1 < 0 || p2 < 0) {
      toast({ title: "Pontuações inválidas", variant: "destructive" });
      return;
    }

    updateMatch.mutate(
      { slug, matchId, data: { player1Score: p1, player2Score: p2 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          toast({ title: "Pontuações atualizadas" });
          setEditingMatch(null);
        },
        onError: () => toast({ title: "Falha na atualização", variant: "destructive" })
      }
    );
  };

  const approvedCount = tournament.participants.filter(p => p.status === 'approved').length;
  const canStart = tournament.status === 'registration' && approvedCount >= 3;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <Link href={`/t/${slug}`} className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors val-clip-tl">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-display uppercase tracking-wider text-foreground">Gerenciar: {tournament.name}</h2>
             <span className="text-xs px-2 py-1 font-display uppercase tracking-wider bg-card border border-border text-foreground">
               {getStatusLabel(tournament.status)}
             </span>
          </div>
          <p className="text-muted-foreground">Painel de Controle do Organizador</p>
        </div>
        {canStart && (
          <Button 
            onClick={handleStartTournament}
            disabled={startTournament.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-widest val-clip-br h-12 px-6 rounded-none"
          >
            {startTournament.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            Iniciar Evento
          </Button>
        )}
      </div>

      <div className="flex overflow-x-auto no-scrollbar border-b border-border/50">
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-6 py-4 font-display uppercase tracking-wider text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'participants' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Participantes ({tournament.participants.length})
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-6 py-4 font-display uppercase tracking-wider text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'matches' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Partidas e Resultados
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'participants' && (
          <div className="space-y-6">
            <div className="bg-muted p-4 border border-border text-sm text-muted-foreground flex items-center justify-between val-clip-tl">
              <span><strong>{approvedCount}</strong> jogadores aprovados. Necessário pelo menos 3 para iniciar.</span>
              {tournament.maxParticipants && <span>Capacidade: {tournament.maxParticipants}</span>}
            </div>

            <div className="bg-card border border-border val-clip-tl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border/50 font-display uppercase tracking-wider text-xs text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Nickname</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tournament.participants.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Nenhuma inscrição ainda.</td>
                    </tr>
                  ) : (
                    tournament.participants.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono">{p.nickname}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 font-display uppercase border ${
                            p.status === 'approved' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                            p.status === 'pending' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 
                            'border-red-500/50 text-red-500 bg-red-500/10'
                          }`}>
                            {getParticipantStatus(p.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {tournament.status === 'registration' && (
                            <div className="flex justify-end gap-2">
                              {p.status !== 'approved' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 rounded-none border-green-500/50 text-green-500 hover:bg-green-500/10 font-display uppercase text-xs"
                                  onClick={() => handleParticipantStatus(p.id, 'approved')}
                                  disabled={updateParticipant.isPending}
                                >
                                  <Check size={14} className="mr-1" /> Aprovar
                                </Button>
                              )}
                              {p.status !== 'rejected' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 rounded-none border-red-500/50 text-red-500 hover:bg-red-500/10 font-display uppercase text-xs"
                                  onClick={() => handleParticipantStatus(p.id, 'rejected')}
                                  disabled={updateParticipant.isPending}
                                >
                                  <X size={14} className="mr-1" /> Rejeitar
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
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            {tournament.status === 'registration' ? (
              <div className="bg-card border border-border p-12 text-center val-clip-tl text-muted-foreground">
                <Shield className="mx-auto mb-4 opacity-50" size={48} />
                <p>O torneio ainda não começou.</p>
                <p className="text-sm mt-2">Aprove os participantes e clique em "Iniciar Evento" para gerar as partidas.</p>
              </div>
            ) : tournament.matches.length === 0 ? (
               <div className="bg-card border border-border p-12 text-center val-clip-tl text-muted-foreground">
                 Nenhuma partida encontrada.
               </div>
            ) : (
              <div className="space-y-8">
                {Array.from(new Set(tournament.matches.map(m => m.round))).sort((a,b)=>a-b).map(round => (
                  <div key={round} className="space-y-4">
                    <h4 className="font-display uppercase tracking-widest text-lg text-primary border-b border-border/50 pb-2">Rodada {round}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tournament.matches.filter(m => m.round === round).map(match => (
                        <div key={match.id} className="bg-card border border-border flex flex-col val-clip-tl relative">
                           {match.status === 'completed' && <div className="absolute top-0 right-0 w-2 h-full bg-primary/20"></div>}
                           <div className="p-4 flex flex-col gap-4">
                              <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest text-muted-foreground">
                                <span>{match.stage === 'swiss' ? 'Suíço' : match.stage === 'round_robin' ? 'Round Robin' : match.stage}</span>
                                <span>{getMatchStatus(match.status)}</span>
                              </div>
                              
                              {editingMatch === match.id ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm w-32 truncate">{match.player1Name || 'A definir'}</span>
                                    <Input 
                                      type="number" 
                                      className="w-20 bg-background border-border font-mono rounded-none" 
                                      value={matchScores.p1}
                                      onChange={(e) => setMatchScores(prev => ({...prev, p1: e.target.value}))}
                                      disabled={!match.player1Id}
                                    />
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm w-32 truncate">{match.player2Name || 'A definir'}</span>
                                    <Input 
                                      type="number" 
                                      className="w-20 bg-background border-border font-mono rounded-none" 
                                      value={matchScores.p2}
                                      onChange={(e) => setMatchScores(prev => ({...prev, p2: e.target.value}))}
                                      disabled={!match.player2Id}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                                    <Button variant="ghost" size="sm" className="rounded-none font-display uppercase tracking-widest text-xs" onClick={() => setEditingMatch(null)}>Cancelar</Button>
                                    <Button 
                                      size="sm" 
                                      className="rounded-none font-display uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90" 
                                      onClick={() => handleSaveMatch(match.id)}
                                      disabled={updateMatch.isPending}
                                    >
                                      {updateMatch.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Salvar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center p-2 border border-border/50 bg-background/50">
                                    <span className="font-mono text-sm truncate mr-2">{match.player1Name || 'A definir'}</span>
                                    <span className="font-display text-lg">{match.player1Score ?? '-'}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 border border-border/50 bg-background/50">
                                    <span className="font-mono text-sm truncate mr-2">{match.player2Name || 'A definir'}</span>
                                    <span className="font-display text-lg">{match.player2Score ?? '-'}</span>
                                  </div>
                                  
                                  {(match.player1Id || match.player2Id) && (
                                    <div className="flex justify-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 rounded-none border-border font-display uppercase text-xs tracking-widest text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                          setMatchScores({
                                            p1: match.player1Score?.toString() || "0",
                                            p2: match.player2Score?.toString() || "0"
                                          });
                                          setEditingMatch(match.id);
                                        }}
                                      >
                                        <Edit3 size={12} className="mr-1" /> Editar Placar
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}