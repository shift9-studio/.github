/* SHIFT-9 Studio — boot. The accessibility check runs BEFORE any GPU context mounts
   (hard gate): prefers-reduced-motion → static composite grid, no 3D loop. */
import './styles.css';
import { checkMotionPreference } from './accessibility';
import { TWEAKS } from './constants';
import { renderStaticGrid } from './ui/shell';

const app = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
if (params.has('static')) TWEAKS.forceStaticGrid = true;

if (checkMotionPreference() || TWEAKS.forceStaticGrid) {
  renderStaticGrid(app);
} else {
  void (async () => {
    const [{ StudioScene }, { Shell }, { AudioEngine }] = await Promise.all([
      import('./engine/scene'),
      import('./ui/shell'),
      import('./audio/engine')
    ]);
    const audio = new AudioEngine();
    const host = document.createElement('div');
    host.className = 's9-canvas-host';
    app.appendChild(host);                       // canvas sits under every overlay
    const studio = new StudioScene(host);
    new Shell(app, studio, audio);
    await studio.init();
    // verification/debug hook (harmless in production; used by the visual-diff harness)
    (window as unknown as Record<string, unknown>).__shift9 = studio;
  })();
}
