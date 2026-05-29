export const FEEDBACK_URL = 'https://partypacer-feedback.web.app/';

// Open external URL; try to leave the app for the system browser.
// iOS standalone PWA — no relaible Safari hand-off; '_system' sometimes
// works, else fall back to a normal tab.
export function openExternal(url: string): void {
  const standalone =
    (typeof navigator !== 'undefined' &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(display-mode: standalone)').matches === true);

  try {
    if (standalone) {
      const w = window.open(url, '_system');
      if (!w) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
