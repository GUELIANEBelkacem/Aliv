export function Footer() {
  return (
    <div className="web-footer">
      <span>© {new Date().getFullYear()} Aliv</span>
      <span className="web-footer-divider">·</span>
      <a href="https://github.com/anthropics/claude-code/issues" target="_blank" rel="noopener">Source &amp; issues</a>
    </div>
  );
}
