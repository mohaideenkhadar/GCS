'use client';

import { ReactNode, useEffect } from 'react';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showConfirm?: boolean;
  children?: ReactNode;
  maxWidth?: string;
}

export const PopupModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  showConfirm = true,
  children,
  maxWidth = '500px',
}: PopupModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
  };

  const colors = {
    info: 'text-info',
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center animate-fadeIn p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-2xl w-full max-h-[90vh] flex flex-col shadow-card-lg animate-slideUp overflow-hidden"
        style={{ maxWidth }}
      >
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-border flex-shrink-0">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-text">
            <i className={`fas ${icons[type]} ${colors[type]}`}></i>
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-2xl font-light text-text-light hover:text-danger transition-transform hover:rotate-90"
          >
            &times;
          </button>
        </div>
        
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          {message && (
            <p className="text-sm sm:text-base text-text leading-relaxed whitespace-pre-line text-center">
              {message}
            </p>
          )}
          {children}
        </div>
        
        {showConfirm && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-border flex justify-center gap-3 flex-wrap flex-shrink-0">
            <button onClick={onClose} className="btn btn-outline min-w-[80px]">
              {cancelLabel}
            </button>
            <button onClick={onConfirm || onClose} className="btn btn-primary min-w-[80px]">
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};