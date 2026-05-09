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

export function Faq() {
  return (
    <section className="qr-faq">
      <h2>FAQ</h2>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.q} data-faq-item>
            <strong>{item.q}</strong>
            <p>{item.a}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
