import { Link } from "wouter";
import { Swords, Users, Trophy } from "lucide-react";

export function LandingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-display uppercase tracking-tighter">
          Hub Tático de <span className="text-primary">Competições</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
          Crie, gerencie e transmita seus torneios com ferramentas profissionais. Chaveamentos Round Robin ou Suíço automáticos.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/sign-up" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 font-display uppercase tracking-widest text-lg val-clip-br transition-all w-full sm:w-auto">
            Tornar-se Organizador
          </Link>
          <Link href="/sign-in" className="bg-card border border-border hover:border-primary/50 text-foreground px-8 py-4 font-display uppercase tracking-widest text-lg val-clip-tl transition-all w-full sm:w-auto">
            Entrar como Organizador
          </Link>
        </div>
        <p className="text-sm text-muted-foreground pt-4">
          Jogadores se inscrevem pelo link público do torneio.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 border-t border-border/50">
        <div className="bg-card p-8 border border-border val-clip-tl text-left space-y-4">
          <div className="w-12 h-12 bg-muted flex items-center justify-center">
            <Users className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-wider text-xl">Inscrição Pública</h3>
          <p className="text-muted-foreground">Jogadores se inscrevem via link público. Revise e aprove os participantes antes do evento começar.</p>
        </div>
        
        <div className="bg-card p-8 border border-border val-clip-tl text-left space-y-4">
          <div className="w-12 h-12 bg-muted flex items-center justify-center">
            <Swords className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-wider text-xl">Formatação Automática</h3>
          <p className="text-muted-foreground">3-6 jogadores geram formato Round Robin (Todos contra Todos). 7+ criam sistema Suíço automaticamente.</p>
        </div>
        
        <div className="bg-card p-8 border border-border val-clip-tl text-left space-y-4">
          <div className="w-12 h-12 bg-muted flex items-center justify-center">
            <Trophy className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-wider text-xl">Tabela em Tempo Real</h3>
          <p className="text-muted-foreground">Tabelas e partidas prontas para transmissão, atualizadas em tempo real enquanto você insere os resultados.</p>
        </div>
      </div>
    </div>
  );
}