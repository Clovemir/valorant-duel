export function RulesView() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="border-b border-border pb-4">
         <h2 className="font-display text-3xl text-foreground uppercase tracking-wide">Regras do Torneio</h2>
         <span className="text-sm font-display text-muted-foreground uppercase tracking-widest">Normas e Formato</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-display text-2xl text-primary mb-4 uppercase tracking-wide border-b border-border/50 pb-2">Formato</h3>
          <ul className="space-y-3 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>Fase de Grupos:</strong> Todos jogam contra todos (Round Robin).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>Vitória:</strong> Corrida até o alvo. Não há empate.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span>O vencedor deve atingir o alvo exato. O perdedor pontua abaixo do alvo.</span>
            </li>
          </ul>
        </section>

        <section className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-display text-2xl text-primary mb-4 uppercase tracking-wide border-b border-border/50 pb-2">Alvos de Pontuação</h3>
          <ul className="space-y-3 text-muted-foreground text-sm">
            <li className="flex justify-between border-b border-border/30 pb-1">
              <span>Fase de Grupos</span>
              <strong className="text-foreground font-display text-lg tracking-wider">15 PTS</strong>
            </li>
            <li className="flex justify-between border-b border-border/30 pb-1">
              <span>Repescagem</span>
              <strong className="text-foreground font-display text-lg tracking-wider">20 PTS</strong>
            </li>
            <li className="flex justify-between border-b border-border/30 pb-1">
              <span>Semifinais</span>
              <strong className="text-foreground font-display text-lg tracking-wider">25 PTS</strong>
            </li>
            <li className="flex justify-between border-b border-border/30 pb-1">
              <span>Terceiro Lugar</span>
              <strong className="text-foreground font-display text-lg tracking-wider">20 PTS</strong>
            </li>
            <li className="flex justify-between pb-1 text-primary">
              <span className="font-semibold uppercase tracking-widest">Grande Final</span>
              <strong className="font-display text-xl tracking-wider">30 PTS</strong>
            </li>
          </ul>
        </section>

        <section className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-display text-2xl text-primary mb-4 uppercase tracking-wide border-b border-border/50 pb-2">Chaveamento</h3>
          <ul className="space-y-3 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>1º, 2º e 3º colocados:</strong> Avançam direto para as semifinais.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>4º vs 5º colocados:</strong> Disputam a Repescagem.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>Semifinal 1:</strong> 1º Colocado vs Vencedor da Repescagem.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">▪</span>
              <span><strong>Semifinal 2:</strong> 2º Colocado vs 3º Colocado.</span>
            </li>
          </ul>
        </section>

        <section className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-display text-2xl text-primary mb-4 uppercase tracking-wide border-b border-border/50 pb-2">Critérios de Desempate</h3>
          <ol className="space-y-3 text-muted-foreground text-sm list-decimal pl-5">
            <li className="pl-2">Número de Vitórias</li>
            <li className="pl-2">Saldo de Pontos (PF - PS)</li>
            <li className="pl-2">Confronto Direto (se aplicável entre empatados)</li>
            <li className="pl-2">Pontos Feitos (PF)</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
