import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, RotateCcw, History, X } from 'lucide-react';

export type ConfirmSeverity = 'danger' | 'warning' | 'info';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: ConfirmSeverity;
  iconType?: 'trash' | 'reset' | 'history' | 'alert';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Sí, Continuar',
  cancelText = 'Cancelar',
  severity = 'warning',
  iconType = 'alert',
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (iconType) {
      case 'trash':
        return <Trash2 className="w-6 h-6 text-red-400" strokeWidth={2.2} />;
      case 'reset':
        return <RotateCcw className="w-6 h-6 text-amber-400" strokeWidth={2.2} />;
      case 'history':
        return <History className="w-6 h-6 text-orange-400" strokeWidth={2.2} />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" strokeWidth={2.2} />;
    }
  };

  const getConfirmButtonClasses = () => {
    if (severity === 'danger') {
      return 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 border border-red-400/40';
    }
    return 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/50 border border-amber-300/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md bg-[#0b101d] border border-slate-700/90 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 id="confirm-modal-title" className="text-base font-extrabold text-white">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
