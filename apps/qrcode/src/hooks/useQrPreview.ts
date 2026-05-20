import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { createQr, updateQr } from '../lib/qr-engine';
import type { QrOptions } from '../lib/types';

const DEBOUNCE_MS = 50;

// Some option changes can't be applied via qr-code-styling's update() because
// its internal mergeDeep skips `undefined`: switching foreground from gradient
// → solid leaves the old gradient stuck (REVIEW §8.1), and adding a logo for
// the first time fails for the same reason. The only reliable path is to
// dispose the instance and create a fresh one. We compute a compact key from
// the structural axes and re-instantiate whenever it changes.
function structuralKey(opts: QrOptions): string {
  return `${opts.foreground.type}|${opts.logo ? '1' : '0'}`;
}

// qr-code-styling stashes its internal QR matrix on `_qr` only after the
// first render resolves. The matrix exposes getModuleCount() which we need
// for snap-to-buckets logo sizing.
interface QrInternal { _qr?: { getModuleCount: () => number } }

function readModuleCount(qr: QRCodeStyling | null): number {
  const internal = qr as unknown as QrInternal | null;
  return internal?._qr?.getModuleCount() ?? 0;
}

export function useQrPreview(
  options: QrOptions,
  externalQrRef?: MutableRefObject<QRCodeStyling | null>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const internalQrRef = useRef<QRCodeStyling | null>(null);
  const qrRef = externalQrRef ?? internalQrRef;
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<QrOptions>(options);
  const lastKeyRef = useRef<string>(structuralKey(options));
  const [moduleCount, setModuleCount] = useState(0);

  // The ref-mutation lint rules are overly strict here: forwarding a ref from
  // a parent so it can call qr methods after render is the idiomatic React
  // pattern, and assigning the latest options to a ref during render is the
  // documented replacement for the previous "no-deps useEffect" approach
  // (REVIEW §8.11).
  /* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps, react-hooks/refs */
  optionsRef.current = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    qrRef.current = createQr(optionsRef.current);
    qrRef.current.append(container);
    lastKeyRef.current = structuralKey(optionsRef.current);
    // The matrix is built asynchronously inside the lib; read on next tick.
    queueMicrotask(() => setModuleCount(readModuleCount(qrRef.current)));
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      container.innerHTML = '';
      qrRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const nextKey = structuralKey(options);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    if (container && qrRef.current && nextKey !== lastKeyRef.current) {
      container.innerHTML = '';
      qrRef.current = createQr(options);
      qrRef.current.append(container);
      lastKeyRef.current = nextKey;
      queueMicrotask(() => setModuleCount(readModuleCount(qrRef.current)));
      return;
    }
    pendingRef.current = setTimeout(() => {
      if (qrRef.current) {
        updateQr(qrRef.current, options);
        queueMicrotask(() => setModuleCount(readModuleCount(qrRef.current)));
      }
    }, DEBOUNCE_MS);
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [options]);
  /* eslint-enable react-hooks/immutability, react-hooks/exhaustive-deps, react-hooks/refs */

  return { containerRef, qrRef, moduleCount };
}
