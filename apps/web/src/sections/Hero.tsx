import { Logo } from '@aliv/ui';

export function Hero() {
  return (
    <section className="web-hero">
      <div className="web-hero-logo" style={{ color: 'var(--accent)' }}>
        <Logo size={120} title="Aliv" />
      </div>
      <h1 className="web-hero-headline">Privacy-first dev utilities.<br />No accounts, no uploads.</h1>
      <p className="web-hero-sub">
        A coherent suite of dark-themed tools that run entirely in your browser.
        Convert, generate, validate — without sending a single byte to anyone.
      </p>
      <a href="#apps" className="web-hero-cta">See the apps&nbsp;↓</a>
    </section>
  );
}
