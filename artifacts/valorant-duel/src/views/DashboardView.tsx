import { Link } from "wouter";
import { Plus, Trophy, Calendar, Users, ArrowRight } from "lucide-react";
import { useListTournaments } from "@workspace/api-client-react";
import { format } from "date-fns";

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'registration': return 'Inscrições';
    case 'active': return 'Ativo';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

export function DashboardView() {
  const { data: tournaments, isLoading, error } = useListTournaments();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-3xl font-display uppercase tracking-wider text-foreground">Seus Torneios</h2>
          <p className="text-muted-foreground">Gerencie seus eventos e acompanhe as competições em andamento.</p>
        </div>
        <Link href="/tournaments/new" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-display uppercase tracking-widest text-sm val-clip-br transition-all flex items-center gap-2">
          <Plus size={18} /> Novo Torneio
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border h-48 animate-pulse val-clip-tl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 val-clip-tl text-center">
          <h3 className="font-display uppercase text-xl mb-2">Erro ao carregar torneios</h3>
          <p>Por favor, tente recarregar a página.</p>
        </div>
      ) : !tournaments || tournaments.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center val-clip-tl flex flex-col items-center justify-center space-y-4">
          <Trophy size={48} className="text-muted-foreground/30" />
          <h3 className="font-display uppercase text-2xl tracking-wider">Nenhum Torneio Ainda</h3>
          <p className="text-muted-foreground max-w-md">Você ainda não criou nenhum torneio. Lance seu primeiro evento para começar a receber inscrições.</p>
          <Link href="/tournaments/new" className="bg-primary text-primary-foreground px-6 py-3 font-display uppercase tracking-widest text-sm val-clip-br mt-4">
            Criar Torneio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-card border border-border flex flex-col val-clip-tl group hover:border-primary/50 transition-colors">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-display uppercase text-xl tracking-wider text-foreground truncate" title={tournament.name}>
                    {tournament.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 font-display uppercase tracking-wider ${
                    tournament.status === 'registration' ? 'bg-primary/20 text-primary border border-primary/30' :
                    tournament.status === 'active' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                    'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {getStatusLabel(tournament.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span>{tournament.participantCount} Participantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    <span>Criado em {format(new Date(tournament.createdAt), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 border-t border-border flex justify-between items-center">
                <Link href={`/t/${tournament.slug}`} className="text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Página Pública
                </Link>
                <Link href={`/t/${tournament.slug}/manage`} className="text-sm font-display uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group-hover:gap-2 duration-300">
                  Gerenciar <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}