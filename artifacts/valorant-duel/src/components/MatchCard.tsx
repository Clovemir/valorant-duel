import { useState, useEffect } from 'react';
import { MatchDef, MatchScore, validateScore } from '@/lib/tournament';
import { Edit2 } from 'lucide-react';

interface MatchCardProps {
  match: MatchDef;
  score?: MatchScore;
  onSave: (id: string, score: MatchScore | null) => void;
}

export function MatchCard({ match, score, onSave }: MatchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [p1Input, setP1Input] = useState(score?.p1Score?.toString() ?? '');
  const [p2Input, setP2Input] = useState(score?.p2Score?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setP1Input(score?.p1Score?.toString() ?? '');
      setP2Input(score?.p2Score?.toString() ?? '');
      setError(null);
    }
  }, [score, isEditing]);

  const canPlay = match.p1 !== 'A definir' && match.p2 !== 'A definir';

  const handleSave = () => {
    if (!p1Input && !p2Input && score) {
      onSave(match.id, null);
      setIsEditing(false);
      return;
    }

    const num1 = parseInt(p1Input, 10);
    const num2 = parseInt(p2Input, 10);
    const valError = validateScore(num1, num2, match.target);
    
    if (valError) {
      setError(valError);
      return;
    }
    
    setError(null);
    onSave(match.id, { p1Score: num1, p2Score: num2 });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const p1Won = score && score.p1Score > score.p2Score;
  const p2Won = score && score.p2Score > score.p1Score;

  const phaseLabel = match.phase === 'group' 
    ? `Rodada ${match.round}` 
    : match.phase === 'repechage' 
    ? 'Repescagem' 
    : match.phase === 'semi' 
    ? 'Semifinal' 
    : match.phase === 'final' 
    ? 'Grande Final' 
    : 'Terceiro Lugar';

  return (
    <div className={`p-4 border border-border bg-card relative shadow-md transition-opacity ${!canPlay ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">
          {phaseLabel} <span className="mx-1">•</span> ALVO: {match.target}
        </span>
        {canPlay && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:text-primary"
            aria-label={`Editar placar de ${match.p1} vs ${match.p2}`}
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className={`flex-1 font-semibold truncate ${p1Won ? 'text-primary' : 'text-foreground'}`}>
          {match.p1}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              className="w-14 bg-background border border-border text-center py-1 px-2 font-display text-lg focus:border-primary outline-none transition-colors" 
              value={p1Input} 
              onChange={e => setP1Input(e.target.value)} 
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label={`Pontos do ${match.p1}`}
            />
            <span className="text-muted-foreground font-display text-xl">-</span>
            <input 
              type="number" 
              className="w-14 bg-background border border-border text-center py-1 px-2 font-display text-lg focus:border-primary outline-none transition-colors" 
              value={p2Input} 
              onChange={e => setP2Input(e.target.value)} 
              onKeyDown={handleKeyDown}
              aria-label={`Pontos do ${match.p2}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 font-display text-2xl font-bold tracking-wider min-w-[5rem]">
            <span className={p1Won ? 'text-primary' : 'text-foreground'}>{score?.p1Score ?? '-'}</span>
            <span className="text-muted-foreground text-sm font-sans">:</span>
            <span className={p2Won ? 'text-primary' : 'text-foreground'}>{score?.p2Score ?? '-'}</span>
          </div>
        )}

        <div className={`flex-1 text-right font-semibold truncate ${p2Won ? 'text-primary' : 'text-foreground'}`}>
          {match.p2}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 flex flex-col items-end gap-2 animate-in slide-in-from-top-2 duration-200">
          {error && <span className="text-xs text-primary font-medium">{error}</span>}
          <div className="flex gap-2">
            <button 
              onClick={handleCancel} 
              className="px-4 py-1.5 text-xs font-display tracking-widest uppercase border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-1.5 text-xs font-display tracking-widest uppercase bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors val-clip-br"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
