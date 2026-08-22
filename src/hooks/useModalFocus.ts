import { useEffect, useRef } from 'react';

export interface UseModalFocusOptions {
  isOpen: boolean;
  onClose?: () => void;
  /**
   * Optional ref to the element that triggered the modal.
   * If omitted, captures document.activeElement right before opening.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /**
   * Optional ref to an inner element that should receive initial focus.
   * If omitted, focuses an element with [data-autofocus], heading with tabIndex=-1, or first focusable control.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Whether pressing Escape triggers onClose. Default is true.
   * Can be set to false during non-interruptible processes (e.g. uploading).
   */
  canCloseOnEscape?: boolean;
  /**
   * Whether to restore focus to trigger when modal closes. Default is true.
   */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([aria-hidden="true"])',
  'a[href]:not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.hasAttribute('disabled')) return false;
    if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
    return true;
  });
}

export function useModalFocus<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  triggerRef,
  initialFocusRef,
  canCloseOnEscape = true,
  restoreFocus = true,
}: UseModalFocusOptions) {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // 1. Manage initial focus and remember trigger element
  useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger or currently focused element
    if (triggerRef?.current) {
      previousActiveElementRef.current = triggerRef.current;
    } else if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const focusTimer = setTimeout(() => {
      if (!containerRef.current) return;

      // Priority 1: User explicitly specified initial focus element
      if (initialFocusRef?.current && containerRef.current.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      // Priority 2: Element explicitly tagged with data-autofocus
      const autoFocusEl = containerRef.current.querySelector<HTMLElement>('[data-autofocus]');
      if (autoFocusEl) {
        autoFocusEl.focus();
        return;
      }

      // Priority 3: First meaningful interactive control inside modal
      const focusableElements = getFocusableElements(containerRef.current);

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }

      // Priority 4: Focus container itself if tabIndex is set
      if (containerRef.current.tabIndex !== undefined && containerRef.current.tabIndex >= -1) {
        containerRef.current.focus();
      }
    }, 20);

    return () => {
      clearTimeout(focusTimer);
      if (restoreFocus && previousActiveElementRef.current && document.body.contains(previousActiveElementRef.current)) {
        // Return focus to trigger element
        const prevEl = previousActiveElementRef.current;
        setTimeout(() => {
          if (document.body.contains(prevEl)) {
            prevEl.focus();
          }
        }, 10);
      }
    };
  }, [isOpen, restoreFocus]);

  // 2. Keyboard Trap: intercept Tab, Shift+Tab, and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      // Handle Escape key
      if (e.key === 'Escape') {
        if (canCloseOnEscape && onClose) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      // Handle Tab key trapping
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current);

        if (focusableElements.length === 0) {
          e.preventDefault();
          containerRef.current.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If focus somehow escaped the container, redirect back into it
        if (!containerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          if (e.shiftKey) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
          return;
        }

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, canCloseOnEscape, onClose]);

  return { containerRef };
}
