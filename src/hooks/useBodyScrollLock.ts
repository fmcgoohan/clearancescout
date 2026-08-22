import { useEffect } from 'react';

// Shared modal counter across all active modal overlays
let activeModalCount = 0;

/**
 * Custom hook to lock body scrolling whenever an overlay or modal dialog is open.
 * Supports nested/stacked modals by tracking an active modal count.
 * Complies with Constitution v1.1.0 Article 7 (Every Defect Becomes Law: Modal Body Scroll Lock).
 */
export function useBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;

    activeModalCount++;
    if (activeModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);
}
