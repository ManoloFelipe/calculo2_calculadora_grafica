import React, { useMemo } from 'react';
import katex from 'katex';

export default function KatexMath({ math, block = false, className = '' }) {
  const html = useMemo(() => {
    if (!math) return '';
    try {
      // Limpiar backslashes duplicados accidentales o delimiters sobrantes
      let clean = String(math).trim();
      if (clean.startsWith('$$') && clean.endsWith('$$')) {
        clean = clean.slice(2, -2);
      } else if (clean.startsWith('$') && clean.endsWith('$')) {
        clean = clean.slice(1, -1);
      }
      return katex.renderToString(clean, {
        displayMode: block,
        throwOnError: false
      });
    } catch (e) {
      return `<code>${math}</code>`;
    }
  }, [math, block]);

  return (
    <span
      className={`${block ? 'block text-center my-2 overflow-x-auto py-1' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
