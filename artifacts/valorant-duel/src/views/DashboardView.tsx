import { useState } from "react";
import { Link } from "wouter";
import { Plus, Users, ArrowRight, ShieldAlert, ChevronRight, Activity, Copy, Check } from "lucide-react";
import { useListTournaments } from "@workspace/api-client-react";
import { format } from "date-fns";

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
      <span className={copied ? "text-accent" : ""}>{copied ? "COPIADO" : "LINK"}</span>
    </button>
  );
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'registration': return 'Inscrições Abertas';
    case 'active': return 'Em Andamento';
    case 'completed': return 'Missão Concluída';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'registration': return 'text-primary bg-primary/10 border-primary/30';
    case 'active': return 'text-accent bg-accent/10 border-accent/30';
    case 'completed': return 'text-muted-foreground bg-muted border-border';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

export function DashboardView() {
  const { data: tournaments, isLoading, error } = useListTournaments();

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-8 border-b border-border relative">
        <div className="corner-br absolute bottom-0 right-0 w-8 h-8"></div>
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary font-mono text-xs uppercase tracking-widest">
            <Activity size={14} /> Status do Sistema: Online
          </div>
          <h2 className="text-3xl md:text-5xl font-display uppercase tracking-tighter text-foreground">
            Central de Comando
          </h2>
          <p className="text-muted-foreground font-sans mt-2">Monitore operações ativas e planeje novos eventos.</p>
        </div>
        <Link 
          href="/tournaments/new" 
          className="group relative bg-primary text-primary-foreground px-6 py-4 font-display uppercase tracking-widest text-sm val-clip-br transition-all flex items-center gap-3 hover:bg-primary/90"
        >
          <Plus size={18} /> Nova Operação
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card/50 border border-border h-56 animate-pulse val-clip-tl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive p-8 val-clip-tl flex flex-col items-center justify-center text-center space-y-4">
          <ShieldAlert size={40} />
          <h3 className="font-display uppercase tracking-widest text-2xl">Falha de Conexão</h3>
          <p className="font-mono text-sm">Não foi possível recuperar os dados. Tente recarregar a interface.</p>
        </div>
      ) : !tournaments || tournaments.length === 0 ? (
        <div className="bg-card/30 border border-border p-16 text-center val-clip-tl flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-20"></div>
          <div className="w-20 h-20 bg-background border border-border flex items-center justify-center val-clip-br rotate-45 mb-4">
            <ShieldAlert size={32} className="text-muted-foreground/50 -rotate-45" />
          </div>
          <h3 className="font-display uppercase text-3xl tracking-widest text-foreground">Nenhuma Operação Ativa</h3>
          <p className="text-muted-foreground max-w-md font-sans">O painel está vazio. Inicie sua primeira operação para abrir registros e organizar o combate.</p>
          <Link href="/tournaments/new" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 font-display uppercase tracking-widest text-sm val-clip-br mt-4 flex items-center gap-2">
            Iniciar <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="group bg-card border border-border flex flex-col val-clip-tl hover:border-primary/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
              
              <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-[10px] px-2 py-1 font-mono uppercase tracking-widest border ${getStatusColor(tournament.status)}`}>
                    {getStatusLabel(tournament.status)}
                  </span>
                  <CopyLinkButton slug={tournament.slug} />
                </div>
                
                <div>
                  <h3 className="font-display uppercase text-2xl tracking-wide text-foreground leading-tight line-clamp-2" title={tournament.name}>
                    {tournament.name}
                  </h3>
                  <div className="text-xs font-mono text-muted-foreground mt-2">
                    ID: {tournament.slug}
                  </div>
                </div>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-primary" />
                      {tournament.participantCount} Agentes
                    </span>
                    <span>{format(new Date(tournament.createdAt), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-background/80 backdrop-blur-sm p-4 border-t border-border flex justify-between items-center gap-4">
                <Link href={`/t/${tournament.slug}`} className="text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex-1 text-center py-2 border border-transparent hover:border-border val-clip-tl">
                  Visão Pública
                </Link>
                <div className="w-[1px] h-6 bg-border"></div>
                <Link href={`/t/${tournament.slug}/manage`} className="text-xs font-display uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary transition-colors flex-1 flex items-center justify-center gap-2 py-2 border border-transparent val-clip-br group/btn">
                  Gerenciar <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}