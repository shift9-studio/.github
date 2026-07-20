import { checkMotionPreference } from './accessibility';
import { TWEAKS } from './constants';

const app = document.getElementById('app')!;

// Hard accessibility gate: decided before any GPU context exists.
if (checkMotionPreference() || TWEAKS.forceStaticGrid) {
  import('./ui/staticGrid').then(m => m.mountStaticGrid(app));
} else {
  import('./ui/shell').then(m => m.mountShell(app));
}
