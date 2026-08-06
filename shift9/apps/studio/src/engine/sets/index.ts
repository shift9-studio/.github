/* Set-builder registry — one builder per `kind` in the PROJECT REGISTRY.
   Builders are ported 1:1 from reference/shift9-scene.js in Phases 3-4
   (BUILD_CONTRACT: sets 12-07 in Phase 3, sets 06-01 in Phase 4), one file
   per kind, each verified screenshot-vs-reference at its set's z before its
   phase closes. Until a kind's builder lands here, streaming builds only the
   shared soundstage floor for that set. */
import type { Group } from 'three';
import type { SetKind, Project } from '../../projects';
import type { AnimatorFn, StudioEngine } from '../experience';

export type SetBuilder = (
  engine: StudioEngine,
  g: Group,
  anims: AnimatorFn[],
  p: Project,
) => void;

import { buildKitchen } from './kitchen';

export const SET_BUILDERS: Partial<Record<SetKind, SetBuilder>> = {
  kitchen: buildKitchen,
};
