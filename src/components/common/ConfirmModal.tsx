'use client';

import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div ref={modalRef} className="bg-white rounded-card max-w-sm w-[90%] flex flex-col animate-slide-up shadow-card-lg">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="font-semibold text-text text-base flex items-center gap-2">
            <i className="fas fa-question-circle" style={{ color: '#a86f2c' }} />
            {title}
          </h3>
          <button onClick={onCancel} className="text-text-light text-2xl font-light hover:text-danger transition-colors">
            &times;
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-text leading-relaxed whitespace-pre-line text-center">{message}</p>
        </div>
        <div className="p-4 border-t border-border flex justify-center gap-3">
          <button onClick={onCancel} className="btn btn-outline min-w-[80px]">Cancel</button>
          <button onClick={onConfirm} className="btn btn-primary min-w-[80px]">Yes</button>
        </div>
      </div>
    </div>
  );
}