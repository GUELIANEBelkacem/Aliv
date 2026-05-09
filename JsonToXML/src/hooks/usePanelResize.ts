import { useState, useEffect, useRef, type RefObject } from 'react';

const STORAGE_KEY = 'jsontoxml-panel-offset';

function loadPercent(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v != null) {
      const n = parseFloat(v);
      if (!isNaN(n) && n >= 20 && n <= 80) return n;
    }
  } catch { /* ignore */ }
  return 50;
}

function savePercent(pct: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(pct * 10) / 10));
  } catch { /* ignore */ }
}

export function usePanelResize(
  containerRef: RefObject<HTMLElement | null>,
  dividerRef: RefObject<HTMLElement | null>,
  minPercent = 20,
  maxPercent = 80,
) {
  const [leftPercent, setLeftPercent] = useState(loadPercent);
  const dragging = useRef(false);

  useEffect(() => {
    const divider = dividerRef.current;
    const container = containerRef.current;
    if (!divider || !container) return;

    const onPointerDown = (e: PointerEvent) => {
      // Don't intercept clicks on child elements (e.g. the swap button)
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      dragging.current = true;
      divider.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(maxPercent, Math.max(minPercent, pct)));
    };

    const onPointerUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const onDblClick = () => setLeftPercent(50);

    divider.addEventListener('pointerdown', onPointerDown);
    divider.addEventListener('dblclick', onDblClick);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      divider.removeEventListener('pointerdown', onPointerDown);
      divider.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [containerRef, dividerRef, minPercent, maxPercent]);

  // Persist to localStorage when value changes
  useEffect(() => {
    savePercent(leftPercent);
  }, [leftPercent]);

  return { leftPercent };
}
