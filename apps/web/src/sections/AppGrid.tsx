import { APPS, appUrl, Logo } from '@aliv/ui';

export function AppGrid() {
  return (
    <section className="web-app-grid-section" id="apps">
      <h2 className="web-section-title">The apps</h2>
      <div className="web-app-grid">
        {APPS.filter((a) => a.id !== 'web').map((app) => {
          const isComingSoon = !!app.comingSoon;
          const cardProps = {
            'data-app-card': true,
            'data-app-id': app.id,
            className: `web-app-card${isComingSoon ? ' is-coming-soon' : ''}`,
            style: { color: app.accent } as const,
          };
          const content = (
            <>
              <div className="web-app-card-leaf">
                <Logo size={48} appId={app.id} />
              </div>
              <h3 className="web-app-card-name">{app.name}</h3>
              <p className="web-app-card-tagline">{app.tagline}</p>
              {isComingSoon && <span className="web-app-card-badge">Coming soon</span>}
            </>
          );
          if (isComingSoon) {
            return <span key={app.id} {...cardProps} aria-disabled="true">{content}</span>;
          }
          return (
            <a key={app.id} {...cardProps} href={appUrl(app)} target="_blank" rel="noopener">
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
