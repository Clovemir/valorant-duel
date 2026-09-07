import { useState } from 'react';
import { Check, Edit2, X, Lock } from 'lucide-react';
import { MatchDef, MatchScore, validateScore } from '@/lib/tournament';

interface Props {
  match: MatchDef;
  score?: MatchScore;
  onSave: (match: MatchDef, score: MatchScore | null) => void;
  readOnly?: boolean;
  compact?: boolean;
  p1Label?: string;
  p2Label?: string;
}

export function MatchCard({ match, score, onSave, readOnly, compact, p1Label, p2Label }: Props) {
  const isTbd = match.p1 === 'A definir' || match.p2 === 'A definir';
  const [isEditing, setIsEditing] = useState(!score && !readOnly && !isTbd);
  const [p1, setP1] = useState(score ? String(score.p1Score) : '');
  const [p2, setP2] = useState(score ? String(score.p2Score) : '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const n1 = Number(p1);
    const n2 = Number(p2);
    const err = validateScore(n1, n2, match.target);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setIsEditing(false);
    onSave(match, { p1Score: n1, p2Score: n2 });
  };

  const handleCancel = () => {
    if (score) {
      setP1(String(score.p1Score));
      setP2(String(score.p2Score));
      setIsEditing(false);
      setError(null);
    } else {
      setP1('');
      setP2('');
      setError(null);
    }
  };

  const isP1Winner = score && score.p1Score > score.p2Score;
  const isP2Winner = score && score.p2Score > score.p1Score;

  return (
    <div className={`relative border bg-card flex flex-col ${isTbd ? 'opacity-50 grayscale border-border/50' : 'border-border shadow-sm'} ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${score ? 'bg-primary/50' : isTbd ? 'bg-muted' : 'bg-primary'}`} />
      
      <div className={`flex flex-col ${compact ? 'p-2 pl-3 gap-1' : 'p-4 pl-5 gap-3'}`}>
        <div className="flex justify-between items-center">
          <span className={`font-display text-muted-foreground uppercase tracking-widest bg-muted/50 val-clip-tl ${compact ? 'px-1.5 py-[1px] text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
            Alvo: {match.target}
          </span>
          {score && !isEditing && !readOnly && !isTbd && (
            <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Editar resultado">
              <Edit2 size={compact ? 12 : 14} />
            </button>
          )}
          {isTbd && <Lock size={compact ? 12 : 14} className="text-muted-foreground/50" />}
        </div>

        <div className="flex flex-col gap-1">
          <div className={`flex justify-between items-center border transition-colors ${isP1Winner ? 'bg-primary/10 border-primary/30' : 'bg-background/50 border-transparent'} ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
            <div className="flex flex-col overflow-hidden mr-2">
              {p1Label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-display leading-none mb-0.5">{p1Label}</span>}
              <span className={`font-semibold truncate ${isP1Winner ? 'text-primary' : 'text-foreground'}`}>{match.p1}</span>
            </div>
            {isEditing && !isTbd ? (
              <input type="number" min="0" value={p1} onChange={e => setP1(e.target.value)} className={`bg-background border border-border text-center font-mono focus:outline-none focus:border-primary shrink-0 ${compact ? 'w-10 h-6 text-xs' : 'w-16 h-8 text-base'}`} />
            ) : (
              <span className={`font-mono font-medium shrink-0 ${compact ? 'text-sm' : 'text-lg'}`}>{score ? score.p1Score : '-'}</span>
            )}
          </div>

          <div className={`flex justify-between items-center border transition-colors ${isP2Winner ? 'bg-primary/10 border-primary/30' : 'bg-background/50 border-transparent'} ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
            <div className="flex flex-col overflow-hidden mr-2">
              {p2Label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-display leading-none mb-0.5">{p2Label}</span>}
              <span className={`font-semibold truncate ${isP2Winner ? 'text-primary' : 'text-foreground'}`}>{match.p2}</span>
            </div>
            {isEditing && !isTbd ? (
              <input type="number" min="0" value={p2} onChange={e => setP2(e.target.value)} className={`bg-background border border-border text-center font-mono focus:outline-none focus:border-primary shrink-0 ${compact ? 'w-10 h-6 text-xs' : 'w-16 h-8 text-base'}`} />
            ) : (
              <span className={`font-mono font-medium shrink-0 ${compact ? 'text-sm' : 'text-lg'}`}>{score ? score.p2Score : '-'}</span>
            )}
          </div>
        </div>

        {error && <div className="text-[10px] text-destructive leading-tight mt-1">{error}</div>}

        {isEditing && !isTbd && (
          <div className={`flex gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-1 text-xs font-display uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-1 val-clip-br focus:outline-none focus:ring-1 focus:ring-primary">
              <Check size={12} /> {!compact && 'Salvar'}
            </button>
            {score && (
              <button onClick={handleCancel} className="bg-muted text-foreground px-2 hover:bg-muted/80 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-muted">
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
