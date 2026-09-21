/**
 * @module focus
 * Focus mode toggle for reading
 */
import { getCurrentPage } from './router.js';

export function initFocus() {
  const isVersePage = getCurrentPage() === 'verse';
  const exitBtn = document.getElementById('focusExitBtn');

  // Only bind the toggle logic if we are on the verse page or if there's a need
  if (!isVersePage) return;

  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input or textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      toggleFocus();
    }
    
    // Focus mode escapes should happen before closing search modals if handled here,
    // or we check if body has class.
    if (e.key === 'Escape') {
      if (document.body.classList.contains('focus-active')) {
        e.preventDefault();
        exitFocus();
      }
    }
  });

  if (exitBtn) {
    exitBtn.addEventListener('click', exitFocus);
  }
}

export function toggleFocus() {
  document.body.classList.toggle('focus-active');
}

export function exitFocus() {
  document.body.classList.remove('focus-active');
}
