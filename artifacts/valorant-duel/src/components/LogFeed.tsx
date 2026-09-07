import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { LogEntry } from '@/hooks/useTournamentState';

export function LogFeed({ logs, onClear }: { logs: LogEntry[], onClear: () => void }) {
  if (logs.length === 0) return null;
  return (
    <div className="bg-card border border-border mt-8 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-lg tracking-wide uppercase text-foreground">Registro de Atividades</h3>
        <button 
          onClick={onClear} 
          className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-destructive p-1"
          title="Limpar registro"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 text-sm">
            <span className="text-muted-foreground font-mono shrink-0">{format(log.timestamp, 'HH:mm')}</span>
            <span className="text-foreground">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
