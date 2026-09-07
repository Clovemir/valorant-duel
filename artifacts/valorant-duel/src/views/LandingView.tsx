import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Swords, Users, Trophy, ChevronRight, User, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LandingView() {
  const [tournamentQuery, setTournamentQuery] = useState("");
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  const handleAccessTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentQuery.trim()) {
      setError("Insira o link ou código da operação");
      return;
    }
    
    let slug = tournamentQuery.trim();
    
    if (slug.includes("/t/")) {
      const parts = slug.split("/t/");
      if (parts.length > 1) {
        slug = parts[1].split(/[/?#]/)[0];
      }
    } else if (slug.startsWith("http") || slug.includes("/")) {
      const parts = slug.split("/");
      slug = parts[parts.length - 1].split(/[?#]/)[0];
    }
    
    if (!slug) {
      setError("Código inválido");
      return;
    }
    
    setLocation(`/t/${slug}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-16">
      <div className="space-y-8 max-w-3xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="inline-block bg-muted/50 border border-border px-4 py-1.5 font-mono text-xs text-primary mb-4 tracking-widest uppercase val-clip-tl">
          Acesso Global
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-display uppercase tracking-tighter leading-none">
          Hub Tático de <br />
          <span className="text-primary relative inline-block">
            Competições
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary val-clip"></div>
          </span>
        </h1>
        <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto font-sans px-4">
          Crie, gerencie e transmita seus torneios com ferramentas profissionais. Chaveamentos Round Robin ou Suíço automáticos baseados no número de agentes em campo.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="bg-card/80 backdrop-blur-md border border-border p-8 md:p-10 val-clip-tl flex flex-col items-start text-left space-y-6 group hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-4 w-full border-b border-border/50 pb-4">
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center val-clip-br group-hover:bg-primary/20 transition-colors">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="font-display uppercase tracking-widest text-2xl text-foreground">Sou Participante</h2>
              <p className="text-xs font-mono text-muted-foreground">NÃO REQUER CONTA</p>
            </div>
          </div>
          <p className="text-muted-foreground font-sans text-sm h-10">
            Insira o link ou código do torneio fornecido pelo seu organizador para se alistar ou acompanhar a operação.
          </p>
          <form onSubmit={handleAccessTournament} className="w-full space-y-3 mt-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                value={tournamentQuery}
                onChange={(e) => {
                  setTournamentQuery(e.target.value);
                  setError("");
                }}
                placeholder="Ex: vct-2024 ou https://..."
                className={`w-full bg-background border ${error ? 'border-destructive' : 'border-border'} focus-visible:ring-primary rounded-none h-14 pl-12 font-mono uppercase text-sm tracking-wider`}
              />
            </div>
            {error && <p className="text-destructive text-xs font-mono">{error}</p>}
            <Button type="submit" className="w-full h-14 bg-card border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary font-display uppercase tracking-widest text-sm val-clip-br transition-all">
              Acessar Operação
            </Button>
          </form>
        </div>

        <div className="bg-card/80 backdrop-blur-md border border-border p-8 md:p-10 val-clip-br flex flex-col items-start text-left space-y-6 group hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-4 w-full border-b border-border/50 pb-4">
            <div className="w-12 h-12 bg-accent/10 flex items-center justify-center val-clip-tl group-hover:bg-accent/20 transition-colors">
              <Shield className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="font-display uppercase tracking-widest text-2xl text-foreground">Sou Organizador</h2>
              <p className="text-xs font-mono text-muted-foreground">CENTRAL DE COMANDO</p>
            </div>
          </div>
          <p className="text-muted-foreground font-sans text-sm h-10">
            Crie sua conta para gerenciar torneios, aprovar agentes e coordenar as chaves de combate.
          </p>
          <div className="w-full space-y-4 mt-auto">
            <Link href="/sign-up" className="flex items-center justify-center w-full h-14 bg-primary text-primary-foreground font-display uppercase tracking-widest text-sm val-clip-tl hover:bg-primary/90 transition-all gap-2">
              Criar Conta Gratuita <ChevronRight size={18} />
            </Link>
            <Link href="/sign-in" className="flex items-center justify-center w-full h-14 bg-background border border-border text-foreground hover:border-border/80 hover:bg-muted font-display uppercase tracking-widest text-sm val-clip-br transition-all">
              Entrar como Organizador
            </Link>
          </div>
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