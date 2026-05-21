/**
 * Mini SVG previews for each shape value qr-code-styling supports. Used in
 * the Modules / Eye-frame / Eye-ball dropdowns so the user can see what each
 * option actually looks like.
 *
 * The icons hint at the *shape style* in the abstract (filled square /
 * rounded square / circle / asymmetric classy curve). The same icon serves
 * the module renderer, the eye-frame and the eye-ball — render-time context
 * decides whether it's a fill, a ring, or a dot, but the underlying shape
 * is the same.
 */

const SIZE = 20;

interface ShapeIconProps {
  shape: string;
}

// Filled square with optional corner-radius.
function squareIcon(rx: number) {
  return <rect x={2} y={2} width={SIZE - 4} height={SIZE - 4} rx={rx} ry={rx} fill="currentColor" />;
}

// Circle that fills the bounding box.
function circleIcon() {
  return <circle cx={SIZE / 2} cy={SIZE / 2} r={(SIZE - 4) / 2} fill="currentColor" />;
}

// "Classy" — square with two DIAGONAL corners rounded (top-left + bottom-right
// here, mirroring qr-code-styling's actual rendering). The radius parameter
// controls how pronounced the asymmetry is.
function classyIcon(radius: number) {
  const r = radius;
  const w = SIZE - 4;
  // Start at top edge just past the top-left rounded corner.
  const d = [
    `M ${2 + r} 2`,
    `L ${2 + w} 2`,
    `L ${2 + w} ${2 + w - r}`,
    `Q ${2 + w} ${2 + w} ${2 + w - r} ${2 + w}`,
    `L 2 ${2 + w}`,
    `L 2 ${2 + r}`,
    `Q 2 2 ${2 + r} 2`,
    'Z',
  ].join(' ');
  return <path d={d} fill="currentColor" />;
}

export function ShapeIcon({ shape }: ShapeIconProps) {
  let content: React.ReactNode = null;
  switch (shape) {
    case 'square':
      content = squareIcon(0);
      break;
    case 'rounded':
      content = squareIcon(3);
      break;
    case 'extra-rounded':
      content = squareIcon(7);
      break;
    case 'dots':
    case 'circle':
    case 'dot':
      content = circleIcon();
      break;
    case 'classy':
      content = classyIcon(4);
      break;
    case 'classy-rounded':
      content = classyIcon(7);
      break;
    default:
      content = squareIcon(0);
  }
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}
