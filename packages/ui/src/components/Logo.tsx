interface LogoProps {
  size?: number;
  title?: string;
  className?: string;
}

export function Logo({ size = 24, title, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <g fill="currentColor">
        <path d="M 472 1024 C 472 900 462 700 482 470 L 522 470 C 532 700 532 900 532 1024 Z"/>
        <path d="M0-1C.5-.55.5-.05 0 0C-.5-.05-.5-.55 0-1Z" transform="translate(495 475) rotate(7) scale(150 405)"/>
        <path d="M0-1C.5-.55.5-.05 0 0C-.5-.05-.5-.55 0-1Z" transform="translate(530 480) rotate(54) scale(150 422)"/>
        <path d="M0-1C.5-.55.5-.05 0 0C-.5-.05-.5-.55 0-1Z" transform="translate(465 480) rotate(-70) scale(140 351)"/>
        <path d="M0-1C.5-.55.5-.05 0 0C-.5-.05-.5-.55 0-1Z" transform="translate(540 720) rotate(65) scale(140 331)"/>
        <path d="M0-1C.5-.55.5-.05 0 0C-.5-.05-.5-.55 0-1Z" transform="translate(450 760) rotate(-81) scale(140 359)"/>
      </g>
    </svg>
  );
}
