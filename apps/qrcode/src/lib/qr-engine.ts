import QRCodeStyling, {
  type Options as QrStylingOptions,
  type DotType,
  type CornerSquareType,
  type CornerDotType,
} from 'qr-code-styling';
import type { QrOptions, ColorFill, ModuleShape, EyeShape } from './types';

const MODULE_SHAPE_MAP: Record<ModuleShape, DotType> = {
  square: 'square',
  rounded: 'rounded',
  dots: 'dots',
  classy: 'classy',
  'classy-rounded': 'classy-rounded',
  'extra-rounded': 'extra-rounded',
};

const EYE_FRAME_MAP: Record<EyeShape, CornerSquareType> = {
  square: 'square',
  rounded: 'extra-rounded',
  leaf: 'extra-rounded',
  circle: 'dot',
};

const EYE_BALL_MAP: Record<EyeShape, CornerDotType> = {
  square: 'square',
  rounded: 'rounded',
  leaf: 'rounded',
  circle: 'dot',
};

function fillToOptions(fill: ColorFill) {
  if (fill.type === 'solid') return { color: fill.color };
  const gradient = fill.type === 'linear-gradient'
    ? { type: 'linear' as const, rotation: ((fill.angle ?? 0) * Math.PI) / 180 }
    : { type: 'radial' as const, rotation: 0 };
  return {
    gradient: {
      ...gradient,
      colorStops: [
        { offset: 0, color: fill.stops[0] },
        { offset: 1, color: fill.stops[1] },
      ],
    },
  };
}

export function toStylingOptions(opts: QrOptions): QrStylingOptions {
  const fg = fillToOptions(opts.foreground);
  const out: QrStylingOptions = {
    // Force SVG so the engine output is consistent across browsers and the
    // export pipeline can compose it back into a framed outer SVG.
    type: 'svg',
    width: opts.size,
    height: opts.size,
    margin: opts.margin,
    data: opts.data || ' ',
    qrOptions: {
      errorCorrectionLevel: opts.errorCorrection,
    },
    dotsOptions: {
      type: MODULE_SHAPE_MAP[opts.moduleShape],
      ...fg,
    },
    backgroundOptions: { color: opts.background.color },
    cornersSquareOptions: {
      type: EYE_FRAME_MAP[opts.eyeFrameShape],
      color: opts.eyeColor ?? (opts.foreground.type === 'solid' ? opts.foreground.color : opts.foreground.stops[0]),
    },
    cornersDotOptions: {
      type: EYE_BALL_MAP[opts.eyeBallShape],
      color: opts.eyeColor ?? (opts.foreground.type === 'solid' ? opts.foreground.color : opts.foreground.stops[0]),
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: opts.logo?.sizeRatio ?? 0,
      margin: opts.logo?.padding ?? 0,
      crossOrigin: 'anonymous',
    },
  };
  if (opts.logo?.src) {
    out.image = opts.logo.src;
  }
  return out;
}

export function createQr(opts: QrOptions): QRCodeStyling {
  return new QRCodeStyling(toStylingOptions(opts));
}

export function updateQr(qr: QRCodeStyling, opts: QrOptions): void {
  qr.update(toStylingOptions(opts));
}

export async function getRawSvg(qr: QRCodeStyling): Promise<string> {
  const blob = await qr.getRawData('svg');
  if (!blob) return '';
  if (blob instanceof Blob) return await blob.text();
  if ('toString' in blob) return blob.toString();
  return '';
}

export async function getRawPng(qr: QRCodeStyling): Promise<Blob | null> {
  const data = await qr.getRawData('png');
  if (!data) return null;
  if (data instanceof Blob) return data;
  return null;
}
