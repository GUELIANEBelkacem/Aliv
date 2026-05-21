import { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const ITEMS = [
  {
    q: 'Is this really free?',
    a: 'Yes. No watermark, no signup, no “unlock high-res” paywall. Built as part of Aliv, a privacy-first dev-tool suite.',
  },
  {
    q: 'Will my logo or content be uploaded anywhere?',
    a: 'No. Every byte stays in your browser. There is no backend.',
  },
  {
    q: 'How big can my logo be before the QR stops scanning?',
    a: 'Above 20% of the QR size, we automatically bump error correction to H. Above 30% with H, scanning still works for most readers but margins shrink — test before you print.',
  },
  {
    q: 'Why does the preview look different in PNG export?',
    a: 'The preview is rendered at the configured size; PNG export upscales the same vector to the resolution you pick (default 1024px). Higher resolution = sharper print.',
  },
  {
    q: 'Can I generate a Wi-Fi QR for a hidden network?',
    a: 'Yes — toggle "Hidden network" in the Wi-Fi tab. We add H:true to the WIFI: payload.',
  },
];

function focusableNodes(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function FaqLauncher() {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      launcherRef.current?.focus();
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const nodes = focusableNodes(modalRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    // Move focus to the close button (first interactive element).
    const nodes = modalRef.current ? focusableNodes(modalRef.current) : [];
    nodes[0]?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="qr-faq-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open FAQ"
        ref={launcherRef}
      >
        <HelpCircle aria-hidden="true" />
        <span>FAQ</span>
      </button>
      {open && (
        <div
          className="qr-faq-modal-root"
          role="dialog"
          aria-label="Frequently asked questions"
          aria-modal="true"
          data-testid="qr-modal-faq"
          ref={modalRef}
        >
          <div className="qr-faq-modal-backdrop" onClick={() => setOpen(false)} />
          <div className="qr-faq-modal">
            <header className="qr-faq-modal-header">
              <h2>Frequently asked</h2>
              <button
                type="button"
                className="qr-faq-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close FAQ"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <ul className="qr-faq-modal-list">
              {ITEMS.map((item) => (
                <li key={item.q} data-faq-item>
                  <strong>{item.q}</strong>
                  <p>{item.a}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
