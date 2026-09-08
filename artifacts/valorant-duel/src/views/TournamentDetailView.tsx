import { useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetTournament, useRegisterParticipant, getGetTournamentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, Trophy, Swords, AlertCircle, UserPlus, FileText, Target, Crosshair, Crown, Copy, Check, Home } from "lucide-react";
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
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-border/50 hover:border-border val-clip-tl bg-background/80 backdrop-blur-sm" title="Copiar Link Público">
      {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      <span className={copied ? "text-accent" : ""}>{copied ? "COPIADO" : "LINK PÚBLICO"}</span>
    </button>
  );
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'registration': return 'Inscrições';
    case 'active': return 'Em Andamento';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

const getFormatLabel = (format: string | null | undefined) => {
  if (!format) return 'A definir';
  switch (format) {
    case 'round_robin': return 'Round Robin';
    case 'swiss': return 'Suíço';
    default: return format;
  }
};

const getParticipantStatus = (status: string) => {
  switch (status) {
    case 'approved': return 'Aprovado';
    case 'pending': return 'Em Análise';
    case 'rejected': return 'Rejeitado';
    default: return status;
  }
};

const getMatchStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'Aguardando';
    case 'ready': return 'Pronto para Combate';
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

const registerSchema = z.object({
  nickname: z.string().min(2, "Nick deve ter pelo menos 2 caracteres").max(32, "Máximo de 32 caracteres"),
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
            title: "Inscrição Enviada",
            description: "Aguardando aprovação do comando central.",
          });
          form.reset();
        },
        onError: (err: any) => {
          toast({
            title: "Falha na Transmissão",
            description: err?.message || "Inscrição negada. Você já pode estar na lista ou o pelotão está cheio.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
          <Target className="text-primary animate-pulse" size={32} />
        </div>
        <p className="font-mono uppercase tracking-[0.3em] text-primary text-sm">Sincronizando Dados...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 bg-destructive/10 border border-destructive/50 flex items-center justify-center val-clip-tl">
          <AlertCircle className="text-destructive" size={48} />
        </div>
        <h2 className="font-display uppercase tracking-widest text-3xl text-foreground">Sinal Perdido</h2>
        <p className="text-muted-foreground font-sans">A operação solicitada não existe ou o link foi corrompido.</p>
        <Link href="/" className="mt-4 bg-card border border-border px-8 py-4 font-display uppercase tracking-widest val-clip-br hover:border-primary/50 transition-colors">
          Retornar à Base
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = tournament.status === 'registration';
  const approvedCount = tournament.participants.filter(p => p.status === 'approved').length;
  
  return (
    <div className="space-y-10">
      {/* Header HUD */}
      <div className="bg-card border border-border val-clip-br relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-2 h-full bg-primary/80"></div>
        
        <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs px-3 py-1.5 font-mono uppercase tracking-widest border val-clip-tl ${
                tournament.status === 'registration' ? 'bg-primary/10 text-primary border-primary/30' :
                tournament.status === 'active' ? 'bg-accent/10 text-accent border-accent/30' :
                'bg-muted text-muted-foreground border-border'
              }`}>
                [ STATUS: {getStatusLabel(tournament.status)} ]
              </span>
              <span className="text-xs px-3 py-1.5 font-mono uppercase tracking-widest bg-background border border-border text-foreground val-clip-br">
                SYS: {getFormatLabel(tournament.format)}
              </span>
              <CopyLinkButton slug={tournament.slug} />
            </div>
            
            <h1 className="text-4xl md:text-7xl font-display uppercase tracking-tighter text-foreground leading-none">
              {tournament.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-mono uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <UsersIcon size={16} className="text-primary" />
                <span>{approvedCount} {tournament.maxParticipants ? `/ ${tournament.maxParticipants}` : ''} AGENTES ATIVOS</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end gap-4">
            {!tournament.isOrganizer && (
              <Link href="/" className="group/btn relative bg-card border border-border hover:border-primary px-8 py-4 font-display uppercase tracking-widest text-sm val-clip-tl transition-all flex items-center gap-3 overflow-hidden">
                <Home size={18} className="text-muted-foreground group-hover/btn:text-primary-foreground relative z-10" /> 
                <span className="relative z-10 group-hover/btn:text-primary-foreground">Início</span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
              </Link>
            )}
            
            {tournament.isOrganizer && (
              <Link href={`/t/${tournament.slug}/manage`} className="group/btn relative bg-card border border-border hover:border-primary px-8 py-4 font-display uppercase tracking-widest text-sm val-clip-tl transition-all flex items-center gap-3 overflow-hidden">
                <Shield size={18} className="text-primary group-hover/btn:text-primary-foreground relative z-10" /> 
                <span className="relative z-10 group-hover/btn:text-primary-foreground">Painel de Controle</span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border/50 gap-2 pb-px">
        {[
          { id: 'overview', label: 'Briefing', icon: FileText },
          { id: 'participants', label: 'Esquadrão', icon: UserPlus },
          { id: 'matches', label: 'Confrontos', icon: Swords },
          { id: 'standings', label: 'Classificação', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-5 font-display uppercase tracking-widest text-sm whitespace-nowrap transition-all val-clip-tl relative ${
                isActive 
                  ? 'bg-muted/50 text-foreground border-t-2 border-primary' 
                  : 'bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground border-t-2 border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? "text-primary" : ""} /> {tab.label}
              {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary/50 blur-[2px]"></div>}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] relative">
        <div className="corner-tl absolute top-0 left-0 w-8 h-8 pointer-events-none"></div>
        <div className="corner-br absolute bottom-0 right-0 w-8 h-8 pointer-events-none"></div>
        
        <div className="pt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-6">
                  <h3 className="font-display uppercase tracking-widest text-2xl text-foreground flex items-center gap-3">
                    <Crosshair className="text-primary" size={24} /> Informações da Missão
                  </h3>
                  <div className="bg-card/50 border border-border p-8 val-clip-br text-muted-foreground space-y-6 font-sans leading-relaxed text-lg">
                    <p>Bem-vindo à área de operações de <strong className="text-foreground">{tournament.name}</strong>. Esta é uma zona competitiva sancionada.</p>
                    
                    <div className="bg-background/80 p-6 border-l-2 border-primary">
                      <h4 className="font-display uppercase text-foreground mb-2 text-xl tracking-wider">Protocolo de Combate</h4>
                      <p className="text-sm">O formato é determinado pela inteligência central quando o período de inscrições for encerrado:</p>
                      <ul className="list-none space-y-3 mt-4 text-sm font-mono">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> 3-6 AGENTES: ROUND ROBIN</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> 7+ AGENTES: SISTEMA SUÍÇO</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {isRegistrationOpen ? (
                  <div className="bg-card border border-primary/50 p-8 val-clip-tl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
                    <div className="relative z-10">
                      <h3 className="font-display uppercase tracking-widest text-2xl text-primary mb-2">Alistamento Aberto</h3>
                      <p className="text-sm text-muted-foreground font-sans mb-6">Insira seu Nickname de operação para solicitar entrada no torneio.</p>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onRegister)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="nickname"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="NICKNAME" 
                                    className="bg-background border-border focus-visible:ring-primary rounded-none h-14 font-mono uppercase text-lg tracking-wider"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage className="font-mono text-xs" />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-[0.2em] val-clip-br transition-all rounded-none"
                            disabled={registerParticipant.isPending}
                          >
                            {registerParticipant.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "SOLICITAR ENTRADA"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border p-8 val-clip-tl space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto bg-background flex items-center justify-center val-clip-br border border-border mb-2">
                      <Shield size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-display uppercase tracking-widest text-xl text-foreground">Alistamento Fechado</h3>
                    <p className="text-sm text-muted-foreground font-sans">O esquadrão está formado. Acompanhe a transmissão.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
               {tournament.participants.length === 0 ? (
                 <div className="bg-card/30 border border-border p-16 text-center val-clip-tl text-muted-foreground font-mono">
                   [ NENHUM AGENTE REGISTRADO NO BANCO DE DADOS ]
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {tournament.participants.map((p, idx) => (
                     <div key={p.id} className="bg-card border border-border p-5 flex flex-col gap-4 val-clip-tl hover:border-primary/30 transition-colors group">
                       <div className="flex justify-between items-start">
                         <span className="font-mono text-xs text-muted-foreground">AG-{String(idx + 1).padStart(3, '0')}</span>
                         <span className={`text-[10px] px-2 py-1 font-mono uppercase tracking-widest border ${
                           p.status === 'approved' ? 'text-accent border-accent/30 bg-accent/10' :
                           p.status === 'pending' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' : 'text-destructive border-destructive/30 bg-destructive/10'
                         }`}>
                           {getParticipantStatus(p.status)}
                         </span>
                       </div>
                       <span className="font-display text-2xl tracking-wide truncate text-foreground group-hover:text-primary transition-colors">{p.nickname}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-6">
              {tournament.matches.length === 0 ? (
                <div className="bg-card/30 border border-border p-16 text-center val-clip-tl text-muted-foreground font-mono">
                  [ MATRIZ DE CONFRONTOS OFFLINE ]
                </div>
              ) : (
                <div className="space-y-12">
                  {Array.from(new Set(tournament.matches.map(m => m.round))).sort((a,b)=>a-b).map(round => (
                    <div key={round} className="space-y-6 relative">
                       <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <h4 className="font-display uppercase tracking-widest text-2xl text-foreground">Rodada <span className="text-primary">{String(round).padStart(2, '0')}</span></h4>
                         <span className="shrink-0 border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                           Meta: {tournament.matches.find(m => m.round === round)?.targetScore ?? 0} rounds
                         </span>
                         <div className="h-px min-w-12 bg-border/50 flex-1"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {tournament.matches.filter(m => m.round === round).map(match => (
                          <div key={match.id} className="bg-card border border-border flex flex-col val-clip-tl hover:border-primary/50 transition-colors group relative overflow-hidden">
                             {match.status === 'completed' && <div className="absolute top-0 right-0 w-1.5 h-full bg-muted"></div>}
                             {match.status === 'ready' && <div className="absolute top-0 right-0 w-1.5 h-full bg-accent"></div>}
                             
                             <div className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                   <span>{getStageLabel(match.stage)}</span>
                                  <span className={match.status === 'ready' ? 'text-accent' : ''}>{getMatchStatus(match.status)}</span>
                                </div>
                                 <div className="flex items-center justify-between border-y border-border/40 bg-background/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                                   <span className="text-muted-foreground">Condição de vitória</span>
                                   <strong className="text-primary">Chegar a {match.targetScore} rounds</strong>
                                 </div>
                                
                                <div className="space-y-1">
                                  <div className={`flex justify-between items-center p-3 border-l-2 transition-colors ${match.player1Score && match.player2Score && match.player1Score > match.player2Score ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-background text-muted-foreground'}`}>
                                    <span className="font-display text-lg tracking-wider truncate mr-4">{match.player1Name || 'A DEFINIR'}</span>
                                    <span className="font-mono text-xl">{match.player1Score ?? '-'}</span>
                                  </div>
                                  
                                  <div className={`flex justify-between items-center p-3 border-l-2 transition-colors ${match.player1Score && match.player2Score && match.player2Score > match.player1Score ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-background text-muted-foreground'}`}>
                                    <span className="font-display text-lg tracking-wider truncate mr-4">{match.player2Name || 'A DEFINIR'}</span>
                                    <span className="font-mono text-xl">{match.player2Score ?? '-'}</span>
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
            <div className="space-y-6">
              {tournament.standings.length === 0 ? (
                <div className="bg-card/30 border border-border p-16 text-center val-clip-tl text-muted-foreground font-mono">
                  [ DADOS DE CLASSIFICAÇÃO INDISPONÍVEIS ]
                </div>
              ) : (
                <div className="bg-card border border-border overflow-hidden val-clip-tl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-background border-b border-border font-mono uppercase tracking-widest text-xs text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 text-center w-20">POS</th>
                          <th className="px-6 py-4">Agente</th>
                          <th className="px-6 py-4 text-center">J</th>
                          <th className="px-6 py-4 text-center">V-D</th>
                          <th className="px-6 py-4 text-center">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 font-sans">
                        {tournament.standings.map((s, idx) => (
                          <tr key={s.participantId} className={`hover:bg-muted/30 transition-colors ${idx === 0 ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-5 text-center">
                              {idx === 0 ? (
                                <Crown size={20} className="mx-auto text-primary" />
                              ) : (
                                <span className="font-display text-xl text-muted-foreground">{s.rank}</span>
                              )}
                            </td>
                            <td className="px-6 py-5 font-display text-xl tracking-wider">{s.nickname}</td>
                            <td className="px-6 py-5 text-center text-muted-foreground font-mono text-sm">{s.played}</td>
                            <td className="px-6 py-5 text-center font-mono text-sm">{s.wins}-{s.losses}</td>
                            <td className="px-6 py-5 text-center font-mono text-sm">
                              <span className={s.differential > 0 ? 'text-accent' : s.differential < 0 ? 'text-destructive' : 'text-muted-foreground'}>
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
    </div>
  );
}

function UsersIcon(props: any) {
  return <UserPlus {...props} />;
}