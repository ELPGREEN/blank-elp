import { useEffect, useRef } from 'react';

export function useCursor() {
  const dotEl = useRef<HTMLDivElement | null>(null);
  const ringEl = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Only enable on non-touch desktop
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    // Create cursor elements
    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'custom-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    dotEl.current = dot;
    ringEl.current = ring;

    document.body.classList.add('custom-cursor-active');

    // Lerp helper
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onDown = () => {
      dotEl.current?.classList.add('custom-cursor-click');
      ringEl.current?.classList.add('custom-cursor-click');
    };
    const onUp = () => {
      dotEl.current?.classList.remove('custom-cursor-click');
      ringEl.current?.classList.remove('custom-cursor-click');
    };

    const onEnterInteractive = () => {
      dotEl.current?.classList.add('custom-cursor-hover');
      ringEl.current?.classList.add('custom-cursor-hover');
    };
    const onLeaveInteractive = () => {
      dotEl.current?.classList.remove('custom-cursor-hover');
      ringEl.current?.classList.remove('custom-cursor-hover');
    };

    const attachInteractivity = () => {
      document.querySelectorAll('a, button, [role="button"], input, select, textarea, label').forEach(el => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    };

    // Animation loop with lerp for ring
    const animate = () => {
      ringPos.current.x = lerp(ringPos.current.x, mouse.current.x, 0.28);
      ringPos.current.y = lerp(ringPos.current.y, mouse.current.y, 0.28);

      if (dotEl.current) {
        dotEl.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px) translate(-50%, -50%)`;
      }
      if (ringEl.current) {
        ringEl.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    // Init positions to center
    ringPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    attachInteractivity();

    const observer = new MutationObserver(() => attachInteractivity());
    observer.observe(document.body, { childList: true, subtree: true });

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(rafId.current);
      observer.disconnect();
      dot.remove();
      ring.remove();
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);
}
