'use client';

import { toast as shadcnToast, useToast as useShadcnToast } from '@/components/ui/use-toast';

export const useToast = () => {
  // Get the dismiss function from the useToast hook
  const { dismiss } = useShadcnToast();
  
  // Return the shadcn toast function directly with our wrappers
  const toast = {
    success: (title: string, description?: string) => {
      shadcnToast({
        title: title || 'Success',
        description,
        variant: 'success',
        duration: 3000,
      });
    },
    error: (title: string, description?: string) => {
      shadcnToast({
        title: title || 'Error',
        description,
        variant: 'destructive',
        duration: 4000,
      });
    },
    warning: (title: string, description?: string) => {
      shadcnToast({
        title: title || 'Warning',
        description,
        variant: 'warning',
        duration: 3500,
      });
    },
    info: (title: string, description?: string) => {
      shadcnToast({
        title: title || 'Info',
        description,
        variant: 'default',
        duration: 3000,
      });
    },
    loading: (title: string, description?: string) => {
      const { id } = shadcnToast({
        title: title || 'Loading',
        description,
        variant: 'loading',
        duration: 10000,
      });
      return id;
    },
    dismiss: (id?: string) => {
      if (id) {
        dismiss(id);
      } else {
        dismiss();
      }
    },
  };

  return toast;
};