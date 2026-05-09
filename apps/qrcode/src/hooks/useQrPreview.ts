import { useEffect, useRef, type MutableRefObject } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { createQr, updateQr } from '../lib/qr-engine';
import type { QrOptions } from '../lib/types';

const DEBOUNCE_MS = 50;

export function useQrPreview(
  options: QrOptions,
  externalQrRef?: MutableRefObject<QRCodeStyling | null>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const internalQrRef = useRef<QRCodeStyling | null>(null);
  const qrRef = externalQrRef ?? internalQrRef;
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<QrOptions>(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  // The ref-mutation lint rule is overly strict here: forwarding a ref from a
  // parent so it can call qr methods after render is the idiomatic React pattern.
  /* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    qrRef.current = createQr(optionsRef.current);
    qrRef.current.append(container);
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      container.innerHTML = '';
      qrRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      if (qrRef.current) updateQr(qrRef.current, options);
    }, DEBOUNCE_MS);
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [options]);
  /* eslint-enable react-hooks/immutability, react-hooks/exhaustive-deps */

  return { containerRef, qrRef };
}
