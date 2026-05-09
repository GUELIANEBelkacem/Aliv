export function Manifesto() {
  return (
    <section className="web-manifesto" id="about">
      <h2 className="web-section-title">Why Aliv exists</h2>
      <div className="web-manifesto-grid">
        <div>
          <h3>No uploads, ever</h3>
          <p>
            Every transformation runs locally in your browser. Your data
            never crosses the wire. There is no backend to compromise.
          </p>
        </div>
        <div>
          <h3>No accounts, no tracking</h3>
          <p>
            No sign-up. No analytics. No third-party fonts or CDNs. The
            only state we keep is the theme cookie that follows you across
            our subdomains.
          </p>
        </div>
        <div>
          <h3>Dark by default</h3>
          <p>
            Every app ships dark-first with a calibrated light mode for
            those who want it. One look, four (and counting) tools.
          </p>
        </div>
        <div>
          <h3>Free, forever</h3>
          <p>
            No watermarks, no exports gated behind a paywall, no “sign in
            to download.” Aliv is a set of tools, not a funnel.
          </p>
        </div>
      </div>
    </section>
  );
}
