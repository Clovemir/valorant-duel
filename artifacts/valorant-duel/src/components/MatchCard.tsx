import { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';
import { MatchDef, MatchScore, validateScore } from '@/lib/tournament';

interface Props {
  match: MatchDef;
  score?: MatchScore;
  onSave: (match: MatchDef, score: MatchScore | null) => void;
  readOnly?: boolean;
}

export function MatchCard({ match, score, onSave, readOnly }: Props) {
  const [isEditing, setIsEditing] = useState(!score && !readOnly);
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
  const isTbd = match.p1 === 'A definir' || match.p2 === 'A definir';

  return (
    <div className={`relative border border-border bg-card overflow-hidden group ${isTbd ? 'opacity-50 grayscale' : ''}`}>
      <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-primary transition-colors" />
      
      <div className="p-4 pl-5">
         <div className="flex justify-between items-center mb-3">
           <span className="text-xs font-display text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 val-clip-tl">Alvo: {match.target}</span>
           {score && !isEditing && !readOnly && !isTbd && (
             <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Editar resultado">
               <Edit2 size={14} />
             </button>
           )}
         </div>

         <div className="flex flex-col gap-2">
           <div className={`flex justify-between items-center px-3 py-2 border transition-colors ${isP1Winner ? 'bg-primary/10 border-primary/30' : 'bg-background/50 border-transparent'}`}>
             <span className={`font-semibold ${isP1Winner ? 'text-primary' : 'text-foreground'}`}>{match.p1}</span>
             {isEditing && !isTbd ? (
               <input type="number" min="0" value={p1} onChange={e => setP1(e.target.value)} className="w-16 bg-background border border-border text-center font-mono py-1 focus:outline-none focus:border-primary" />
             ) : (
               <span className="font-mono text-lg">{score ? score.p1Score : '-'}</span>
             )}
           </div>
           <div className={`flex justify-between items-center px-3 py-2 border transition-colors ${isP2Winner ? 'bg-primary/10 border-primary/30' : 'bg-background/50 border-transparent'}`}>
             <span className={`font-semibold ${isP2Winner ? 'text-primary' : 'text-foreground'}`}>{match.p2}</span>
             {isEditing && !isTbd ? (
               <input type="number" min="0" value={p2} onChange={e => setP2(e.target.value)} className="w-16 bg-background border border-border text-center font-mono py-1 focus:outline-none focus:border-primary" />
             ) : (
               <span className="font-mono text-lg">{score ? score.p2Score : '-'}</span>
             )}
           </div>
         </div>

         {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

         {isEditing && !isTbd && (
           <div className="mt-4 flex gap-2">
             <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2 text-sm font-display uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 val-clip-br focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
               <Check size={14} /> Salvar
             </button>
             {score && (
               <button onClick={handleCancel} className="bg-muted text-foreground px-3 hover:bg-muted/80 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-muted">
                 <X size={14} />
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
}
