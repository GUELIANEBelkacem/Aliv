import type { AppId } from '../registry/types';

interface LogoProps {
  size?: number;
  title?: string;
  className?: string;
  /** Which app's mark to render. Defaults to the platform leaf ('web'). */
  appId?: AppId;
}

// Pixel-traced from Design/logo_green.png via potrace — the platform brand mark.
const WEB_LEAF_PATH =
  'M580.81 970.07C583.12 969.46 582.99 969.23 577.86 964.83C544.85 936.47 524.67 900.39 517.86 857.50C516.24 847.35 516.28 822.65 517.93 809.00C523.82 760.27 546.42 700.75 583.86 635.40C600.00 607.22 620.17 575.65 634.28 556.50L640.18 548.50L631.51 557.50C601.57 588.58 577.92 617.25 554.38 651.00C549.97 657.33 544.75 665.20 542.77 668.50C540.80 671.80 536.63 678.77 533.50 684.00C525.94 696.65 511.32 726.58 505.13 742.07C498.61 758.39 489.86 784.79 486.59 798.00C473.41 851.28 471.66 909.19 481.61 963.29L483.24 972.20L530.82 971.46C556.99 971.05 579.49 970.43 580.81 970.07ZM366.53 833.96C388.12 832.14 410.65 827.32 434.70 819.37C443.94 816.31 452.06 813.49 452.75 813.11C453.64 812.62 451.72 809.03 446.25 800.95C409.62 746.78 362.47 705.84 303.50 677.00C271.83 661.52 233.53 650.67 195.00 646.27C175.10 643.99 130.80 644.03 111.50 646.33C89.66 648.94 70.00 652.16 70.00 653.14C70.00 653.99 74.74 663.22 83.23 678.90C85.49 683.08 90.93 691.90 95.31 698.50C102.80 709.78 105.66 713.60 119.59 730.97C128.23 741.75 151.37 764.62 163.53 774.41C194.96 799.72 231.64 818.34 268.37 827.64C297.90 835.12 328.95 837.11 366.53 833.96ZM699.05 722.95C732.04 720.38 759.77 713.41 791.50 699.73C802.72 694.89 818.44 686.93 818.83 685.88C819.02 685.40 819.61 685.00 820.15 685.00C820.70 685.00 826.17 681.70 832.32 677.67C874.91 649.76 913.92 607.68 940.94 560.50C951.42 542.21 966.24 509.91 964.82 508.49C963.04 506.70 920.98 503.84 900.42 504.10C884.82 504.30 855.93 506.84 838.50 509.54C815.84 513.05 780.06 523.34 758.00 532.70C728.25 545.31 699.30 563.11 673.00 584.95C657.96 597.45 636.79 618.67 625.06 633.03C614.13 646.39 599.92 665.32 597.18 670.14C596.14 671.99 592.59 677.77 589.29 683.00C585.99 688.23 581.21 696.43 578.67 701.23L574.03 709.95L579.29 711.48C592.74 715.39 620.13 720.48 635.50 721.92C642.10 722.53 649.08 723.18 651.00 723.36C659.54 724.14 686.77 723.91 699.05 722.95ZM462.98 680.75C462.93 675.69 460.01 648.89 458.60 640.50C454.08 613.80 452.45 605.89 447.96 589.00C437.89 551.09 424.99 518.13 408.82 489.00C394.45 463.10 388.94 454.49 374.73 435.70C343.05 393.80 298.61 355.42 248.48 326.69C232.56 317.56 201.09 302.99 181.22 295.54C162.15 288.39 138.79 281.00 135.26 281.00C131.69 281.00 136.37 342.20 142.60 377.00C152.59 432.73 178.91 495.42 208.94 535.01C226.95 558.75 253.27 586.56 269.00 598.47C272.57 601.18 281.04 607.58 287.81 612.70C294.58 617.82 305.83 625.43 312.81 629.60C324.56 636.63 354.91 651.99 363.00 655.00C364.93 655.71 367.85 656.89 369.50 657.61C383.72 663.82 419.61 674.65 440.00 678.88C445.77 680.08 452.30 681.45 454.50 681.93C461.52 683.46 463.00 683.25 462.98 680.75ZM584.00 556.10C598.39 527.91 607.62 506.18 614.47 484.34C621.70 461.28 627.28 438.03 630.96 415.58C636.25 383.37 637.01 373.91 637.05 340.50C637.09 304.55 634.42 279.67 626.93 246.20C616.73 200.61 600.03 158.95 573.73 113.50C566.07 100.25 546.14 71.13 534.24 55.78C528.72 48.66 528.14 48.20 526.75 49.78C519.58 58.00 489.59 111.30 483.97 125.81C482.97 128.39 479.72 136.35 476.74 143.50C456.33 192.55 447.02 239.83 447.01 294.51C447.00 327.24 449.37 348.62 456.57 380.72C459.61 394.28 469.41 424.69 475.18 438.50C479.55 448.94 495.04 479.95 498.91 486.00C512.83 507.74 518.22 515.63 527.78 528.27C540.12 544.57 547.55 553.39 561.91 568.77C571.31 578.83 571.53 579.00 573.00 576.87C573.83 575.68 578.77 566.33 584.00 556.10ZM693.52 502.60C720.14 488.44 747.68 471.19 765.55 457.47C796.64 433.61 825.04 406.06 844.92 380.50C855.85 366.43 873.03 339.93 880.57 325.50C901.35 285.71 912.04 251.92 921.54 196.00C926.75 165.34 929.12 109.46 926.60 77.00C925.72 65.72 925.00 55.94 925.00 55.25C925.00 53.12 922.35 53.84 912.76 58.57C875.00 77.19 849.47 92.34 824.68 110.82C799.77 129.40 773.02 154.78 756.61 175.40C748.58 185.49 736.00 202.67 736.00 203.55C736.00 203.86 734.28 206.67 732.17 209.80C705.27 249.81 682.60 313.38 675.57 368.50C670.86 405.44 669.98 440.54 672.98 472.50C673.55 478.55 674.49 488.68 675.08 495.00C676.45 509.86 676.75 511.05 678.86 510.18C679.78 509.81 686.38 506.39 693.52 502.60Z';

function WebMark() {
  return <path fillRule="evenodd" d={WEB_LEAF_PATH} />;
}

// JSON ↔ XML — amber `{` (JSON) on the left, json-xml-purple `>` chevron (XML
// closing tag) on the right, bidirectional arrow in between (text-coloured via
// var(--text) so it reads in light + dark). Brace and chevron share endpoints
// at y=192 and y=832 and mirror around x=512 (brace bulges in to x=128, chevron
// apex out to x=896). The arrow body spans 380→644 so both heads have a clean
// 136-unit inner line between their wings.
function JsonXmlMark() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M320 192 C256 192 224 240 224 288 V416 C224 464 192 512 128 512 C192 512 224 560 224 608 V736 C224 784 256 832 320 832"
        stroke="#fbbf24"
        strokeWidth={64}
      />
      <path
        d="M704 192 L896 512 L704 832"
        stroke="#7c8cf5"
        strokeWidth={64}
      />
      <path
        d="M380 512 H644 M380 512 L444 448 M380 512 L444 576 M644 512 L580 448 M644 512 L580 576"
        stroke="var(--text)"
        strokeWidth={48}
      />
    </g>
  );
}

// Modular QR mark — a 5×5 conceptual grid of rounded "code pixels" with four
// L-shaped finder patterns (three modules each) anchoring the corners and a
// single alignment module at the centre. 13 uniform 144×144 squares (rx=18) on
// a 168-pitch grid (24-unit gap) with 104-unit margin. Each corner L points
// inward toward the centre; the four-fold symmetry is graphic rather than
// canonical-QR (real QR has 3 finders, not 4) but reads more confidently as
// a designed mark.
function QrCodeMark() {
  return (
    <>
      <rect x={104} y={104} width={144} height={144} rx={18} />
      <rect x={272} y={104} width={144} height={144} rx={18} />
      <rect x={104} y={272} width={144} height={144} rx={18} />
      <rect x={608} y={104} width={144} height={144} rx={18} />
      <rect x={776} y={104} width={144} height={144} rx={18} />
      <rect x={776} y={272} width={144} height={144} rx={18} />
      <rect x={440} y={440} width={144} height={144} rx={18} />
      <rect x={104} y={608} width={144} height={144} rx={18} />
      <rect x={104} y={776} width={144} height={144} rx={18} />
      <rect x={272} y={776} width={144} height={144} rx={18} />
      <rect x={776} y={608} width={144} height={144} rx={18} />
      <rect x={608} y={776} width={144} height={144} rx={18} />
      <rect x={776} y={776} width={144} height={144} rx={18} />
    </>
  );
}

// Upright `#`. Four pill-shaped bars, perfectly symmetric around (512, 512):
// horizontal bar centres at y=420/604, vertical bar centres at x=420/604.
function HashGenMark() {
  return (
    <>
      <rect x={120} y={380} width={784} height={80} rx={40} />
      <rect x={120} y={564} width={784} height={80} rx={40} />
      <rect x={380} y={120} width={80} height={784} rx={40} />
      <rect x={564} y={120} width={80} height={784} rx={40} />
    </>
  );
}

function MarkFor({ appId }: { appId: AppId }) {
  switch (appId) {
    case 'json-xml':
      return <JsonXmlMark />;
    case 'qrcode':
      return <QrCodeMark />;
    case 'hashgen':
      return <HashGenMark />;
    case 'web':
    default:
      return <WebMark />;
  }
}

export function Logo({ size = 24, title, className, appId = 'web' }: LogoProps) {
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
        <MarkFor appId={appId} />
      </g>
    </svg>
  );
}
