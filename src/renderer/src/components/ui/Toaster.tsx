import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useUi } from "@/store/uiStore";

const icons = { success: CheckCircle2, error: TriangleAlert, info: Info };

export function Toaster() {
  const toasts = useUi(s => s.toasts);
  const dismiss = useUi(s => s.dismissToast);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map(t => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <Icon size={16} />
            <span>{t.message}</span>
            <button className="icon-button" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
