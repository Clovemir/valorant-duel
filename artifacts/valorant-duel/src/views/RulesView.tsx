export function RulesView() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Regras do Torneio</h2>
        <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Formato e Inspiração</span>
      </div>

      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section className="space-y-3 border-l-2 border-primary pl-4">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide">Inspiração VCT</h3>
          <p>
            O formato deste torneio foi fortemente inspirado nos princípios competitivos oficiais da Riot Games para o VCT (Valorant Champions Tour) das temporadas 2025 e 2026. Este é um formato não-oficial da comunidade, adaptado para um grupo de cinco amigos jogando 1 contra 1.
          </p>
          <p>
            Ele emprega grupos para ranqueamento inicial, bonifica a consistência durante a temporada regular com vantagens de sementes (byes) na fase de Playoffs, e aumenta as apostas nas fases finais com alvos de pontuação maiores (simulando a mudança de Melhor de 3 para Melhor de 5 nos palcos internacionais).
          </p>
          <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-3">
            <span className="font-semibold block mb-1">Fontes Oficiais Consultadas:</span>
            <ul className="list-disc list-inside space-y-1">
              <li><a href="https://valorantesports.com/news/vct-2025-season-start-eyntk" target="_blank" rel="noreferrer" className="text-primary hover:underline">VCT 2025 Season Start</a></li>
              <li><a href="https://valorantesports.com/en-US/season/115571062868511862/handbook/115571062868708472" target="_blank" rel="noreferrer" className="text-primary hover:underline">Official 2026 Event Handbook</a></li>
              <li><a href="https://valorantesports.com/en-GB/news/2026-vct-emea-stage-1-format-dates-and-tickets" target="_blank" rel="noreferrer" className="text-primary hover:underline">2026 VCT EMEA Format</a></li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide">Fase de Grupos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Os 5 jogadores se enfrentam exatamente uma vez (formato Round-Robin).</li>
            <li>São realizadas 5 rodadas, cada uma contendo 2 partidas. A cada rodada, 1 jogador recebe uma folga.</li>
            <li>A pontuação alvo para todas as partidas da fase de grupos é de <strong>15 pontos</strong>. Não pode haver empates, e o vencedor deve atingir exatamente 15.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide">Fase de Entrada (Play-in)</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Os jogadores que encerrarem a fase de grupos nas posições 4 e 5 disputam a partida de Entrada (Play-in).</li>
            <li>O vencedor garante a última vaga nos Playoffs. O perdedor é eliminado.</li>
            <li>A pontuação alvo para o Play-in sobe para <strong>20 pontos</strong>.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-xl text-foreground uppercase tracking-wide">Playoffs (Eliminação Dupla)</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>As posições 1, 2 e 3 da fase de grupos avançam diretamente para os Playoffs (recebendo byes).</li>
            <li>O Seed 1 enfrenta o vencedor do Play-in. O Seed 2 enfrenta o Seed 3.</li>
            <li>A pontuação alvo para todas as partidas da chave superior e inferior é de <strong>25 pontos</strong>.</li>
            <li><strong>Regra da Casa - Grande Final:</strong> A Grande Final é disputada com alvo de <strong>30 pontos</strong>. Não há reinício de chave (bracket reset) caso o vencedor da chave inferior vença o primeiro jogo.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
