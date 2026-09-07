import { Link } from "wouter";
import { Swords, Users, Trophy, ChevronRight } from "lucide-react";

export function LandingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-16">
      <div className="space-y-8 max-w-3xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="inline-block bg-muted/50 border border-border px-4 py-1.5 font-mono text-xs text-primary mb-4 tracking-widest uppercase val-clip-tl">
          Acesso Global
        </div>
        
        <h1 className="text-6xl md:text-8xl font-display uppercase tracking-tighter leading-none">
          Hub Tático de <br />
          <span className="text-primary relative inline-block">
            Competições
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary val-clip"></div>
          </span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-sans">
          Crie, gerencie e transmita seus torneios com ferramentas profissionais. Chaveamentos Round Robin ou Suíço automáticos baseados no número de agentes em campo.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Link href="/sign-up" className="group relative bg-primary text-primary-foreground px-8 py-5 font-display uppercase tracking-widest text-lg val-clip-br transition-all w-full sm:w-auto overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              Iniciar Operação <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </Link>
          <Link href="/sign-in" className="group bg-card border border-border hover:border-primary/50 hover:text-primary text-foreground px-8 py-5 font-display uppercase tracking-widest text-lg val-clip-tl transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
            Acessar Central
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
        
        <div className="bg-card/50 backdrop-blur-sm p-8 border border-border val-clip-tl text-left space-y-5 hover:border-primary/30 transition-colors group">
          <div className="w-14 h-14 bg-background border border-border flex items-center justify-center val-clip-br group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors">
            <Users className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-widest text-xl text-foreground">Inscrição Direta</h3>
          <p className="text-muted-foreground text-sm font-sans leading-relaxed">Jogadores se alistam via link público. Revise e aprove o esquadrão antes da operação iniciar.</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-sm p-8 border border-border val-clip-tl text-left space-y-5 hover:border-primary/30 transition-colors group">
          <div className="w-14 h-14 bg-background border border-border flex items-center justify-center val-clip-br group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors">
            <Swords className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-widest text-xl text-foreground">Formatos Dinâmicos</h3>
          <p className="text-muted-foreground text-sm font-sans leading-relaxed">3-6 agentes geram Round Robin. 7+ engajam o sistema Suíço automaticamente.</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-sm p-8 border border-border val-clip-tl text-left space-y-5 hover:border-primary/30 transition-colors group">
          <div className="w-14 h-14 bg-background border border-border flex items-center justify-center val-clip-br group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors">
            <Trophy className="text-primary" size={24} />
          </div>
          <h3 className="font-display uppercase tracking-widest text-xl text-foreground">Intel em Tempo Real</h3>
          <p className="text-muted-foreground text-sm font-sans leading-relaxed">Tabelas e chaves atualizadas instantaneamente. Pronto para transmissão e análise de dados.</p>
        </div>
      </div>
    </div>
  );
}