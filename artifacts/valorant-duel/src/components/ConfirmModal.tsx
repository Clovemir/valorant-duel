interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border p-6 max-w-sm w-full val-clip-br shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="font-display text-2xl text-primary mb-2 uppercase tracking-wide">{title}</h3>
        <p className="text-muted-foreground mb-8 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
           <button 
             onClick={onClose} 
             className="px-5 py-2 text-xs font-display uppercase tracking-widest border border-border text-foreground hover:bg-muted transition-colors"
           >
             Cancelar
           </button>
           <button 
             onClick={() => { onConfirm(); onClose(); }} 
             className="px-5 py-2 text-xs font-display uppercase tracking-widest bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-colors val-clip-br"
           >
             Confirmar
           </button>
        </div>
      </div>
    </div>
  );
}
