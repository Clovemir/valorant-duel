import { useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetTournament, useRegisterParticipant, getGetTournamentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, Trophy, Swords, AlertCircle, UserPlus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'registration': return 'Inscrições';
    case 'active': return 'Ativo';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

const getFormatLabel = (format: string | null | undefined) => {
  if (!format) return '';
  switch (format) {
    case 'round_robin': return 'Round Robin';
    case 'swiss': return 'Suíço';
    default: return format;
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

const registerSchema = z.object({
  nickname: z.string().min(2, "O nick deve ter pelo menos 2 caracteres").max(32, "Máximo de 32 caracteres"),
});

export function TournamentDetailView() {
  const { slug } = useParams();
  const { data: tournament, isLoading, error } = useGetTournament(slug || "");
  const registerParticipant = useRegisterParticipant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'matches' | 'standings'>('overview');

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nickname: "" },
  });

  const onRegister = (values: z.infer<typeof registerSchema>) => {
    if (!slug) return;
    
    registerParticipant.mutate(
      { slug, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(slug) });
          toast({
            title: "Inscrição realizada com sucesso",
            description: "Sua inscrição está aguardando aprovação do organizador.",
          });
          form.reset();
        },
        onError: (err: any) => {
          toast({
            title: "Falha na inscrição",
            description: err?.message || "Não foi possível inscrever-se. Você já pode estar inscrito ou o torneio está cheio.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-display uppercase tracking-widest text-muted-foreground">Carregando Informações...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <AlertCircle className="text-destructive" size={48} />
        <h2 className="font-display uppercase tracking-widest text-2xl text-foreground">Torneio Não Encontrado</h2>
        <p className="text-muted-foreground">O torneio solicitado não existe ou está indisponível.</p>
        <Link href="/" className="mt-4 bg-primary px-6 py-2 font-display uppercase tracking-widest val-clip-br text-primary-foreground hover:bg-primary/90">
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = tournament.status === 'registration';
  const approvedCount = tournament.participants.filter(p => p.status === 'approved').length;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card border border-border val-clip-tl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 font-display uppercase tracking-wider ${
                tournament.status === 'registration' ? 'bg-primary/20 text-primary border border-primary/30' :
                tournament.status === 'active' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                'bg-muted text-muted-foreground border border-border'
              }`}>
                {getStatusLabel(tournament.status)}
              </span>
              {tournament.format && (
                <span className="text-xs px-2 py-1 font-display uppercase tracking-wider bg-card border border-border text-foreground">
                  {getFormatLabel(tournament.format)}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tighter text-foreground">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm font-display uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <UsersIcon size={16} className="text-primary" />
                <span>{approvedCount} {tournament.maxParticipants ? `/ ${tournament.maxParticipants}` : ''} Jogadores</span>
              </div>
            </div>
          </div>
          
          {tournament.isOrganizer && (
            <Link href={`/t/${tournament.slug}/manage`} className="bg-primary/10 border border-primary text-primary hover:bg-primary/20 px-6 py-3 font-display uppercase tracking-widest text-sm val-clip-br transition-all flex items-center gap-2">
              <Shield size={16} /> Gerenciar Evento
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border/50">
        {[
          { id: 'overview', label: 'Visão Geral', icon: FileText },
          { id: 'participants', label: 'Participantes', icon: UserPlus },
          { id: 'matches', label: 'Partidas', icon: Swords },
          { id: 'standings', label: 'Classificação', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-display uppercase tracking-wider text-sm whitespace-nowrap border-b-2 transition-colors focus:outline-none focus-visible:bg-muted ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <h3 className="font-display uppercase tracking-wider text-xl text-foreground flex items-center gap-2">
                  <Shield className="text-primary" size={20} /> Sobre Este Evento
                </h3>
                <div className="bg-card border border-border p-6 val-clip-tl text-muted-foreground space-y-4">
                  <p>Bem-vindo ao {tournament.name}. Este é um evento competitivo organizado no Hub Tático de Competições.</p>
                  <p><strong>Detalhes do formato:</strong> O formato do torneio é determinado automaticamente pelo número de participantes aprovados quando as inscrições fecham.</p>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>3-6 jogadores: Round Robin (todos contra todos).</li>
                    <li>7+ jogadores: Sistema Suíço (partidas baseadas no histórico), seguido de playoffs, se aplicável.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {isRegistrationOpen && (
                <div className="bg-card border border-primary/50 p-6 val-clip-tl space-y-4">
                  <h3 className="font-display uppercase tracking-wider text-xl text-primary">Inscrições Abertas</h3>
                  <p className="text-sm text-muted-foreground">Insira seu nickname no jogo para se inscrever. Todas as inscrições exigem aprovação do organizador.</p>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nickname"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Nickname do Jogador" 
                                className="bg-background border-border focus-visible:ring-primary rounded-none h-12 font-mono uppercase"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-widest val-clip-br rounded-none"
                        disabled={registerParticipant.isPending}
                      >
                        {registerParticipant.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Entrar no Torneio"}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
              
              {!isRegistrationOpen && (
                <div className="bg-muted border border-border p-6 val-clip-tl space-y-2 text-center">
                  <h3 className="font-display uppercase tracking-wider text-lg text-foreground">Inscrições Fechadas</h3>
                  <p className="text-sm text-muted-foreground">Este torneio não está mais aceitando novos participantes.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
             {tournament.participants.length === 0 ? (
               <div className="bg-card border border-border p-12 text-center val-clip-tl text-muted-foreground">
                 Nenhum participante se inscreveu ainda.
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {tournament.participants.map(p => (
                   <div key={p.id} className="bg-card border border-border p-4 flex items-center justify-between val-clip-br">
                     <span className="font-mono text-lg">{p.nickname}</span>
                     <span className={`text-xs px-2 py-1 font-display uppercase ${
                       p.status === 'approved' ? 'text-green-500' :
                       p.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                     }`}>
                       {getParticipantStatus(p.status)}
                     </span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {tournament.matches.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center val-clip-tl text-muted-foreground">
                As partidas ainda não foram geradas.
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(new Set(tournament.matches.map(m => m.round))).sort((a,b)=>a-b).map(round => (
                  <div key={round} className="space-y-4">
                    <h4 className="font-display uppercase tracking-widest text-lg text-primary border-b border-border/50 pb-2">Rodada {round}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tournament.matches.filter(m => m.round === round).map(match => (
                        <div key={match.id} className="bg-card border border-border flex flex-col val-clip-tl relative overflow-hidden">
                           {match.status === 'completed' && <div className="absolute top-0 right-0 w-2 h-full bg-muted"></div>}
                           <div className="p-4 flex flex-col gap-3">
                              <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest text-muted-foreground">
                                <span>{match.stage === 'swiss' ? 'Suíço' : match.stage === 'round_robin' ? 'Round Robin' : match.stage}</span>
                                <span>{getMatchStatus(match.status)}</span>
                              </div>
                              <div className="space-y-2">
                                <div className={`flex justify-between items-center p-2 border ${match.player1Score && match.player2Score && match.player1Score > match.player2Score ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                                  <span className="font-mono truncate mr-2">{match.player1Name || 'A definir'}</span>
                                  <span className="font-display text-lg">{match.player1Score ?? '-'}</span>
                                </div>
                                <div className={`flex justify-between items-center p-2 border ${match.player1Score && match.player2Score && match.player2Score > match.player1Score ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                                  <span className="font-mono truncate mr-2">{match.player2Name || 'A definir'}</span>
                                  <span className="font-display text-lg">{match.player2Score ?? '-'}</span>
                                </div>
                              </div>
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

        {activeTab === 'standings' && (
          <div className="space-y-4">
            {tournament.standings.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center val-clip-tl text-muted-foreground">
                A classificação estará disponível assim que o torneio começar.
              </div>
            ) : (
              <div className="bg-card border border-border overflow-hidden val-clip-tl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground font-display uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-4 py-3 text-center">Posição</th>
                        <th className="px-4 py-3">Jogador</th>
                        <th className="px-4 py-3 text-center">Jogos</th>
                        <th className="px-4 py-3 text-center">V-D</th>
                        <th className="px-4 py-3 text-center">Saldo de Rodadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {tournament.standings.map((s) => (
                        <tr key={s.participantId} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-4 text-center font-display text-lg text-primary">{s.rank}</td>
                          <td className="px-4 py-4 font-mono font-medium">{s.nickname}</td>
                          <td className="px-4 py-4 text-center text-muted-foreground font-mono">{s.played}</td>
                          <td className="px-4 py-4 text-center font-mono">{s.wins}-{s.losses}</td>
                          <td className="px-4 py-4 text-center font-mono">
                            <span className={s.differential > 0 ? 'text-green-500' : s.differential < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                              {s.differential > 0 ? '+' : ''}{s.differential}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
  return <UserPlus {...props} />;
}
