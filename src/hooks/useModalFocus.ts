import { useEffect, useRef } from 'react';
import { useBodyScrollLock } from './useBodyScrollLock';

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

  // Automatically lock body scroll when open (Article 7 Defect Law)
  useBodyScrollLock(isOpen);

  // 1. Manage initial focus and remember trigger element
  useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger or currently focused element
    if (triggerRef?.current) {
      previousActiveElementRef.current = triggerRef.current;
    } else if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const setInitialFocus = () => {
      if (!containerRef.current) return;

      // Priority 1: User explicitly specified initial focus element
      if (initialFocusRef?.current && containerRef.current.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      // Priority 2: Element explicitly tagged with data-autofocus or autofocus
      const autoFocusEl = containerRef.current.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
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

      // Priority 4: Heading with tabIndex=-1
      const heading = containerRef.current.querySelector<HTMLElement>('h1, h2, h3, h4, [role="heading"]');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) {
          heading.setAttribute('tabindex', '-1');
        }
        heading.focus();
        return;
      }

      // Priority 5: Focus container itself
      if (!containerRef.current.hasAttribute('tabindex')) {
        containerRef.current.setAttribute('tabindex', '-1');
      }
      containerRef.current.focus();
    };

    // Attempt immediately and also in next tick/frame
    setInitialFocus();
    const rafId = requestAnimationFrame(setInitialFocus);
    const timeoutId = setTimeout(setInitialFocus, 10);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      if (restoreFocus && previousActiveElementRef.current && document.body.contains(previousActiveElementRef.current)) {
        const prevEl = previousActiveElementRef.current;
        try {
          prevEl.focus();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, restoreFocus]);

  // 1.5. Manage background accessibility tree inertness (set aria-hidden on top-level body siblings and #root)
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const modifiedElements: HTMLElement[] = [];

    // Check direct body children (#root and top-level siblings)
    Array.from(document.body.children).forEach((child) => {
      if (child instanceof HTMLElement && child !== container && !child.contains(container)) {
        if (!child.hasAttribute('aria-hidden')) {
          child.setAttribute('aria-hidden', 'true');
          modifiedElements.push(child);
        }
      }
    });

    // Fallback safeguard: if container is rendered inside #root, mark siblings within #root as aria-hidden
    const rootEl = document.getElementById('root');
    if (rootEl && rootEl.contains(container)) {
      Array.from(rootEl.children).forEach((child) => {
        if (child instanceof HTMLElement && child !== container && !child.contains(container)) {
          if (!child.hasAttribute('aria-hidden')) {
            child.setAttribute('aria-hidden', 'true');
            modifiedElements.push(child);
          }
        }
      });
    }

    return () => {
      modifiedElements.forEach((el) => {
        el.removeAttribute('aria-hidden');
      });
    };
  }, [isOpen]);

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

        // If focus somehow escaped the container or is on the container itself
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
          // Shift + Tab: if on first element or container, wrap to last element
          if (document.activeElement === firstElement || document.activeElement === containerRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          } else if (document.activeElement === containerRef.current) {
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

