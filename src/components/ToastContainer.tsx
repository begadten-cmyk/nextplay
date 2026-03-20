import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
          </div>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-dismiss" onClick={() => onDismiss(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
