// Asset Manifest #5 — MUST run BEFORE the GPU context mounts
export const checkMotionPreference = (): boolean => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) { return true; }        // DISABLE 3D LOOP → static composite grid
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) window.location.reload();       // Hard reload is the safest way to stop the loop
  });
  return false;
};
