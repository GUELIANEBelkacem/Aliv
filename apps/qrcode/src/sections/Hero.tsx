import { ShieldCheck, EyeOff, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <header className="qr-hero">
      <h1 className="qr-hero-title">Beautifully customizable<br />QR codes.</h1>
      <p className="qr-hero-sub">
        Wi-Fi, vCard, URL, calendar — generate, color, shape, brand with a logo,
        export as PNG or SVG. Every byte stays in your browser.
      </p>
      <div className="qr-hero-chips">
        <span className="qr-chip"><ShieldCheck aria-hidden="true" />Free forever</span>
        <span className="qr-chip"><EyeOff aria-hidden="true" />No login</span>
        <span className="qr-chip"><Sparkles aria-hidden="true" />No watermark</span>
      </div>
    </header>
  );
}
