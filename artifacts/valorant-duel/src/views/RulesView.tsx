export function RulesView() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Regras do Torneio</h2>
        <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato e Inspiração</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border border-border p-6 bg-card/30 flex flex-col gap-3 relative shadow-sm hover:border-primary/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
          <span className="font-display text-primary text-2xl uppercase tracking-wider">1. Grupos</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todos contra todos (Round Robin). <strong className="text-foreground font-normal">5 rodadas</strong> totais. Alvo de vitória é <strong className="text-foreground font-normal">15 pontos</strong>.
          </p>
        </div>
        <div className="border border-border p-6 bg-card/30 flex flex-col gap-3 relative shadow-sm hover:border-primary/70 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/70" />
          <span className="font-display text-primary text-2xl uppercase tracking-wider">2. Play-in</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            4º e 5º colocados da fase de grupos disputam a última vaga para os playoffs. Alvo aumenta para <strong className="text-foreground font-normal">20 pontos</strong>.
          </p>
        </div>
        <div className="border border-border p-6 bg-card/30 flex flex-col gap-3 relative shadow-sm hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <span className="font-display text-primary text-2xl uppercase tracking-wider">3. Playoffs</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Eliminação Dupla. Top 3 avançam direto. Alvo é <strong className="text-foreground font-normal">25 pontos</strong> (Grande Final exige <strong className="text-foreground font-normal">30 pontos</strong>).
          </p>
        </div>
      </div>

      <div className="space-y-10 text-foreground/80 leading-relaxed">
        <section className="space-y-4 border-l-2 border-primary pl-6">
          <h3 className="font-display text-2xl text-foreground uppercase tracking-wide">Inspiração VCT</h3>
          <p>
            O formato deste torneio foi fortemente inspirado nos princípios competitivos oficiais da Riot Games para o VCT (Valorant Champions Tour) das temporadas 2025 e 2026. Este é um formato não-oficial da comunidade, adaptado para um grupo de cinco amigos jogando 1 contra 1.
          </p>
          <p>
            Ele emprega grupos para ranqueamento inicial, bonifica a consistência durante a temporada regular com vantagens de sementes (byes) na fase de Playoffs, e aumenta as apostas nas fases finais com alvos de pontuação maiores (simulando a mudança de Melhor de 3 para Melhor de 5 nos palcos internacionais).
          </p>
          <div className="text-sm text-muted-foreground mt-4 bg-background/50 border border-border p-4">
            <span className="font-display uppercase tracking-widest text-xs block mb-2 text-foreground">Fontes Oficiais Consultadas:</span>
            <ul className="list-disc list-inside space-y-1.5 marker:text-primary">
              <li><a href="https://valorantesports.com/news/vct-2025-season-start-eyntk" target="_blank" rel="noreferrer" className="text-primary hover:underline hover:text-primary/80 transition-colors">VCT 2025 Season Start</a></li>
              <li><a href="https://valorantesports.com/en-US/season/115571062868511862/handbook/115571062868708472" target="_blank" rel="noreferrer" className="text-primary hover:underline hover:text-primary/80 transition-colors">Official 2026 Event Handbook</a></li>
              <li><a href="https://valorantesports.com/en-GB/news/2026-vct-emea-stage-1-format-dates-and-tickets" target="_blank" rel="noreferrer" className="text-primary hover:underline hover:text-primary/80 transition-colors">2026 VCT EMEA Format</a></li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide border-b border-border/50 pb-2">Fase de Grupos</h3>
          <ul className="list-disc list-inside space-y-3 marker:text-muted-foreground">
            <li>Os 5 jogadores se enfrentam exatamente uma vez (formato Round-Robin).</li>
            <li>São realizadas 5 rodadas, cada uma contendo 2 partidas. A cada rodada, 1 jogador recebe uma folga.</li>
            <li>A pontuação alvo para todas as partidas da fase de grupos é de <strong className="text-foreground">15 pontos</strong>. Não pode haver empates, e o vencedor deve atingir exatamente a meta.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide border-b border-border/50 pb-2">Fase de Entrada (Play-in)</h3>
          <ul className="list-disc list-inside space-y-3 marker:text-muted-foreground">
            <li>Os jogadores que encerrarem a fase de grupos nas posições 4 e 5 disputam a partida de Entrada (Play-in).</li>
            <li>O vencedor garante a última vaga nos Playoffs. O perdedor é eliminado do torneio.</li>
            <li>A pontuação alvo para o Play-in sobe para <strong className="text-foreground">20 pontos</strong>.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide border-b border-border/50 pb-2">Playoffs (Eliminação Dupla)</h3>
          <ul className="list-disc list-inside space-y-3 marker:text-muted-foreground">
            <li>As posições 1, 2 e 3 da fase de grupos avançam diretamente para os Playoffs (recebendo byes).</li>
            <li>O Seed 1 enfrenta o vencedor do Play-in. O Seed 2 enfrenta o Seed 3.</li>
            <li>A pontuação alvo para todas as partidas regulares da chave superior e inferior é de <strong className="text-foreground">25 pontos</strong>.</li>
            <li className="bg-primary/5 p-4 border border-primary/20 list-none mt-4">
              <strong className="font-display uppercase tracking-widest text-primary text-xs block mb-1">Regra da Casa - Grande Final:</strong> 
              A Grande Final é disputada com alvo de <strong className="text-foreground">30 pontos</strong>. Não há reinício de chave (bracket reset) caso o vencedor da chave inferior vença o primeiro jogo.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
