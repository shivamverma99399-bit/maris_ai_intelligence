import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirmSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(3,2,6,0.85)] backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-md maris-glass-primary rounded-2xl border border-[rgba(157,0,255,0.4)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#81758F] hover:text-[#F2EDF7] p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 text-[#FF858D] mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.18)] border border-[rgba(239,68,68,0.4)] flex items-center justify-center">
            <LogOut className="w-5 h-5 text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#F2EDF7]">
              SIGN OUT
            </h2>
            <p className="text-[11px] text-[#81758F]">Maritime Intelligence Terminal</p>
          </div>
        </div>

        <p className="text-sm text-[#B9ADBF] leading-relaxed mb-6">
          Are you sure you want to sign out of MARIS?
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-xs font-bold text-[#B9ADBF] hover:text-[#F2EDF7] transition-all cursor-pointer"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={onConfirmSignOut}
            className="px-5 py-2 rounded-lg bg-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.4)] border border-[#EF4444] text-xs font-bold text-[#FF858D] hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
};
