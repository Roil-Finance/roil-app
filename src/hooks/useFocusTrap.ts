import { useEffect, useRef } from 'react';

/**
 * useFocusTrap — keyboard-accessibility helper for modal-style components.
 *
 * When `active` flips to true:
 *   1. The currently focused element is remembered.
 *   2. Focus is moved into the container (first focusable element).
 *   3. Tab + Shift+Tab cycles within the container; focus cannot escape.
 *
 * When `active` flips back to false (or the component unmounts) focus is
 * returned to whatever was focused before the trap opened, so keyboard
 * users land back where they started.
 *
 * Usage:
 *   const ref = useFocusTrap<HTMLDivElement>(isOpen);
 *   return <div ref={ref} role="dialog" aria-modal="true">…</div>
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean,
) {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusables.length > 0) {
      // Defer one tick so React has finished mounting children.
      requestAnimationFrame(() => focusables[0]?.focus());
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (!container) return;
      const items = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}
