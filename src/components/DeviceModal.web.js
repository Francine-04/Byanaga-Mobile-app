import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function DeviceModal({ visible, onRequestClose, children }) {
  const container = useRef(null);
  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement;
    container.current?.focus();
    return () => previous?.focus?.();
  }, [visible]);
  if (!visible) return null;
  const host = document.getElementById('app-device-screen');
  if (!host) return null;
  return createPortal(
    <div ref={container} role="dialog" aria-modal="true" tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); onRequestClose?.(); }
        if (event.key === 'Tab') {
          const controls = [...container.current.querySelectorAll('button, input, select, [tabindex="0"]')].filter((el) => !el.disabled);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && (document.activeElement === first || document.activeElement === container.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && (document.activeElement === last || document.activeElement === container.current)) { event.preventDefault(); first.focus(); }
        }
      }}
      style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'inherit', outline: 'none' }}>
      {children}
    </div>, host,
  );
}
