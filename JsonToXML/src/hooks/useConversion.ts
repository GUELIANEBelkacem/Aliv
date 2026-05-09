import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { xmlToJson, jsonToXml } from '../lib/converter';
import { detectFormat } from './useAutoDetect';
import type {
  ConversionDirection,
  ConversionResult,
  ConversionOptions,
  DetectedFormat,
} from '../types/settings';

interface UseConversionParams {
  input: string;
  direction: ConversionDirection;
  options: ConversionOptions;
  autoConvert: boolean;
}

export function useConversion({ input, direction, options, autoConvert }: UseConversionParams) {
  const [result, setResult] = useState<ConversionResult>({ output: '', error: null });
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>('unknown');
  const [conversionTime, setConversionTime] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending state via external store pattern to avoid setState-in-effect
  const pendingRef = useRef(false);
  const pendingListeners = useRef(new Set<() => void>());
  const setPending = useCallback((v: boolean) => {
    if (pendingRef.current !== v) {
      pendingRef.current = v;
      pendingListeners.current.forEach((l) => l());
    }
  }, []);
  const pending = useSyncExternalStore(
    useCallback((cb: () => void) => {
      pendingListeners.current.add(cb);
      return () => { pendingListeners.current.delete(cb); };
    }, []),
    () => pendingRef.current,
  );

  const convert = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setResult({ output: '', error: null });
        setConversionTime(null);
        return;
      }

      const detected = detectFormat(text);
      setDetectedFormat(detected);

      let effectiveDirection: 'json-to-xml' | 'xml-to-json';
      if (direction === 'auto') {
        if (detected === 'json') effectiveDirection = 'json-to-xml';
        else if (detected === 'xml') effectiveDirection = 'xml-to-json';
        else {
          setResult({ output: '', error: { message: 'Cannot detect format. Please select a conversion direction.' } });
          setConversionTime(null);
          return;
        }
      } else {
        effectiveDirection = direction;
      }

      const start = performance.now();
      if (effectiveDirection === 'json-to-xml') {
        setResult(jsonToXml(text, options));
      } else {
        setResult(xmlToJson(text, options));
      }
      setConversionTime(Math.round(performance.now() - start));
    },
    [direction, options],
  );

  useEffect(() => {
    if (!autoConvert) return;
    setPending(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      convert(input);
      setPending(false);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input, autoConvert, convert, setPending]);

  const manualConvert = useCallback(() => {
    setPending(false);
    convert(input);
  }, [convert, input, setPending]);

  return { result, detectedFormat, conversionTime, manualConvert, pending };
}
