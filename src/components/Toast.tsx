import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start space-x-3 text-white backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${
            t.type === 'success'
              ? 'bg-gray-900/95 border-emerald-500/50'
              : t.type === 'error'
              ? 'bg-red-900/95 border-red-500/50'
              : 'bg-gray-900/95 border-blue-500/50'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

          <div className="flex-1">
            <div className="text-sm font-black">{t.title}</div>
            {t.description && (
              <div className="text-xs text-gray-300 font-bold mt-0.5 leading-snug">
                {t.description}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-gray-400 hover:text-white shrink-0 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
