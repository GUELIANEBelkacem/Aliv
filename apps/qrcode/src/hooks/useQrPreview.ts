import { useEffect, useRef } from 'react';
import { createQr, updateQr } from '../lib/qr-engine';
import type { QrOptions } from '../lib/types';

const DEBOUNCE_MS = 50;

export function useQrPreview(options: QrOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<ReturnType<typeof createQr> | null>(null);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef<QrOptions>(options);

  useEffect(() => {
    optionsRef.current = options;
  });

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

  return { containerRef, qr: qrRef };
}
