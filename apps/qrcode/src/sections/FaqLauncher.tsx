import { useEffect, useState } from 'react';
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
  {
    q: 'What about batch generation / CSV import?',
    a: 'Not in v1. Tracked for a follow-up release. The current build is a single-QR tool.',
  },
];

export function FaqLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="qr-faq-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open FAQ"
      >
        <HelpCircle aria-hidden="true" />
        <span>FAQ</span>
      </button>
      {open && (
        <div className="qr-faq-modal-root" role="dialog" aria-label="Frequently asked questions" aria-modal="true">
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
