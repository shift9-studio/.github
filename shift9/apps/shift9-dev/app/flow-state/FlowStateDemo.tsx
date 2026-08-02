"use client";

import { useReducedMotionSafe } from "@shift9/motion";
import s from "./flow-state.module.css";

const WAVE_BARS = Array.from({ length: 13 }, (_, index) => index);

export function FlowStateDemo() {
  const reducedMotion = useReducedMotionSafe();

  return (
    <figure
      className={s.demo}
      data-reduced={reducedMotion ? "true" : "false"}
    >
      <figcaption className={s.srOnly}>
        Flow State captures a local waveform and inserts the resulting text
        into the active app.
      </figcaption>

      <div className={s.demoLabels} aria-hidden="true">
        <span>Armed</span>
        <span>Capture</span>
        <span>Local buffer</span>
      </div>

      <div className={s.demoRail} aria-hidden="true">
        <div className={s.fMark}>
          <span>F</span>
        </div>

        <div className={s.waveform}>
          {WAVE_BARS.map((bar) => (
            <i key={bar} className={s.waveBar} />
          ))}
        </div>

        <div className={s.appSim}>
          <div className={s.appSimHeader}>
            <span>Notes.exe / active</span>
            <span>Text inserted</span>
          </div>
          <div className={s.typedLine}>
            <span className={s.typedCopy}>
              Flow State keeps me in the thought.
            </span>
          </div>
        </div>
      </div>

      <div className={s.demoFooter} aria-hidden="true">
        <span>Ctrl + Win</span>
        <span>Mic waveform</span>
        <span>Never uploaded</span>
      </div>
    </figure>
  );
}
