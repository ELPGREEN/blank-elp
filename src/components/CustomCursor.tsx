import { useCursor } from '@/hooks/useCursor';

// Mounts cursor tracking effect — renders nothing visible itself
// Cursor DOM elements are injected by the hook
export function CustomCursor() {
  useCursor();
  return null;
}
