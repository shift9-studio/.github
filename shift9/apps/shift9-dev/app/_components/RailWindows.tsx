"use client";

/* ────────────────────────────────────────────────────────────────────────
   RAIL WINDOWS — what opens when you click the desktop's left rail.

   EIGHT ROOMS, EIGHT WORLDS. The rule here is that no two of these screens
   share a layout, because eight variations of one list would make the rail
   pointless: you would learn nothing by opening a second one. Each takes its
   structure from a different reference in Kariim's library:

     Home      a title card — huge cropped wordmark, one artifact, hairlines
     Portfolio footage bleeding behind a dense mono readout
     Media     a wall of dithered monitors, one of them alive
     Products  a bento of unequal panels, the flagship taking the big one
     Contacts  an inverted poster: the address IS the page
     Settings  an instrument panel of real travelling switches
     Goals     a single spine with the roster hung off it
     Reports   a printed table, figures right-aligned, one oversized total

   Every fact on these screens is READ, never typed:
   - the twelve projects, their statuses, notes, tags and destinations come
     from SET_PIECES, the same roster the studio dolly renders;
   - the counts on Home, Goals and Reports are computed from that roster at
     render time, so a status change moves all three at once and none of
     them can drift from the folders on the desktop behind.

   Nothing here invents a target, a date, a metric or a claim. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SET_PIECES, type SetPiece } from "./studio-dolly-data";
import s from "./RailWindows.module.css";

export type RailKey =
  | "home"
  | "portfolio"
  | "media"
  | "products"
  | "contacts"
  | "settings"
  | "goals"
  | "reports";

export const RAIL_KEYS: RailKey[] = [
  "home",
  "portfolio",
  "media",
  "products",
  "contacts",
  "settings",
  "goals",
  "reports",
];

/* Title shown in the window's breadcrumb, and the line along its foot. The
   foot line says what the screen is FOR, in the studio's own voice. */
export const RAIL_META: Record<RailKey, { title: string; note: string }> = {
  home: {
    title: "Home",
    note: "the front of the studio — every other room is a door off this one",
  },
  portfolio: {
    title: "Portfolio",
    note: "twelve projects, each with the film shot for it; pick one from the strip",
  },
  media: {
    title: "Media",
    note: "every clip the studio has shot; touch one to wake it, click to play it",
  },
  products: {
    title: "Products",
    note: "only the things you can actually open or install today",
  },
  contacts: {
    title: "Contacts",
    note: "one address, answered by the person who built everything here",
  },
  settings: {
    title: "Settings",
    note: "these switches are real — they change the desktop behind this window",
  },
  goals: {
    title: "Goals",
    note: "read from the project roster, not typed — what has landed and what has not",
  },
  reports: {
    title: "Reports",
    note: "counted from the same roster at the moment you opened this window",
  },
};

/* The opening and closing films. These four live outside the project roster
   because they are the studio's own footage rather than a project's. */
const FILM = [
  {
    id: "approach",
    title: "The approach",
    note: "The first beat of the opening film. Outside, walking in.",
    plate: "/experience/opening/01-exterior-approach-poster.jpg",
    clip: "/experience/opening/01-03-approach-entry-hall-v4.mp4",
  },
  {
    id: "desk",
    title: "The desk",
    note: "The second beat. The hand lands on the mouse and the screen wakes.",
    plate: "/experience/opening/00-entry-seam.jpg",
    clip: "/experience/opening/04-desk-mouse-screen-v5.mp4",
  },
  {
    id: "banner",
    title: "The mark settles",
    note: "The wordmark resolving out of the field.",
    plate: "/experience/shift-9_new-banner.jpg",
    clip: "/experience/outro/banner-settle.mp4",
  },
  {
    id: "invitation",
    title: "The invitation",
    note: "The closing field, shot for the end of the site.",
    plate: "/experience/shift-9_new-banner.jpg",
    clip: "/experience/outro/invitation-field.mp4",
  },
];

const BANNER = "/experience/shift-9_new-banner.jpg";

export type RailWindowProps = {
  section: RailKey;
  /* Which desktop folder each project sits in, so Portfolio can filter by it
     without owning a second copy of that decision. */
  folderOf: Record<string, "apps" | "games" | "tools">;
  email: string;
  studioHref: string;
  onEnterStudio: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /* Live desktop controls, wired straight through to the shell's own state. */
  dark: boolean;
  onToggleTheme: () => void;
  compact: boolean;
  onSetCompact: (v: boolean) => void;
  calm: boolean;
  onSetCalm: (v: boolean) => void;
  /* Lets Home send the visitor to another rail section without closing. */
  onGo: (key: RailKey) => void;
  reducedMotion: boolean;
};

/* ── shared bits ───────────────────────────────────────────────────────── */

const isLive = (p: SetPiece) => Boolean(p.href && !p.href.startsWith("/soon"));

function Plate({
  plate,
  clip,
  alt,
  play,
  reducedMotion,
}: {
  plate: string;
  clip: string;
  alt: string;
  play: boolean;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  /* The still is what loads; the clip only ever runs while its tile is the
     one being looked at. Sixteen videos playing at once is not atmosphere,
     it is a dropped frame rate. */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play && !reducedMotion) {
      const go = v.play();
      if (go) go.catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [play, reducedMotion]);

  return (
    <span className={s.plate}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={plate} alt={alt} loading="lazy" decoding="async" />
      <video
        ref={ref}
        src={clip}
        poster={plate}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className={play && !reducedMotion ? s.playing : ""}
      />
    </span>
  );
}

function Status({ p }: { p: SetPiece }) {
  return (
    <span className={`${s.status} ${p.resolution === "resolved" ? s.resolved : s.volatile}`}>
      {p.status}
    </span>
  );
}

/* ── HOME — the title card ─────────────────────────────────────────────── */

function Home({
  onGo,
  email,
  studioHref,
  onEnterStudio,
}: Pick<RailWindowProps, "onGo" | "email" | "studioHref" | "onEnterStudio">) {
  const live = SET_PIECES.filter(isLive).length;
  const landed = SET_PIECES.filter((p) => p.resolution === "resolved").length;
  const building = SET_PIECES.length - landed;

  return (
    <div className={s.card}>
      {/* Cropped by the frame on purpose: you are standing too close to the
          sign to read all of it, which is what being inside a place feels
          like. Outlined, so the artwork under it stays the loudest thing. */}
      <span className={s.cardWord} aria-hidden="true">
        SHIFT-9
      </span>

      <div className={s.cardStage}>
        <figure className={s.cardArt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BANNER} alt="The Shift-9 mark" />
        </figure>
        <p className={s.cardSay}>
          A studio that builds interfaces, tools and product surfaces.
        </p>
        <p className={s.cardCount}>
          {SET_PIECES.length} projects &#183; {landed} landed &#183; {building}{" "}
          being built &#183; {live} you can open right now
        </p>
      </div>

      <nav className={s.cardDoors} aria-label="The other rooms">
        <button type="button" onClick={() => onGo("portfolio")}>
          <i>01</i> The work <em>&#8599;</em>
        </button>
        <button type="button" onClick={() => onGo("media")}>
          <i>02</i> The film <em>&#8599;</em>
        </button>
        <a href={`mailto:${email}`}>
          <i>03</i> The address <em>&#8599;</em>
        </a>
        <a href={studioHref} onClick={onEnterStudio}>
          <i>04</i> The site <em>&#8599;</em>
        </a>
      </nav>

      <p className={s.cardTip}>Everything here was made by one person</p>
    </div>
  );
}

/* ── PORTFOLIO — footage behind a readout ──────────────────────────────── */

const FILTERS: { key: "all" | "apps" | "games" | "tools"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "apps", label: "Apps" },
  { key: "games", label: "Games" },
  { key: "tools", label: "Tools" },
];

function Portfolio({
  folderOf,
  reducedMotion,
}: Pick<RailWindowProps, "folderOf" | "reducedMotion">) {
  const [filter, setFilter] = useState<"all" | "apps" | "games" | "tools">("all");
  const [pick, setPick] = useState(0);
  const stripRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const shown = useMemo(
    () =>
      filter === "all"
        ? SET_PIECES
        : SET_PIECES.filter((p) => folderOf[p.title] === filter),
    [filter, folderOf],
  );

  /* Narrowing the filter must never leave the hero showing something the
     strip no longer contains. */
  useEffect(() => {
    const current = SET_PIECES[pick];
    if (current && shown.includes(current)) return;
    const first = shown[0];
    if (first) setPick(SET_PIECES.indexOf(first));
  }, [shown, pick]);

  const hero = SET_PIECES[pick] ?? SET_PIECES[0];
  if (!hero) return null;

  const onStripKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const last = shown.length - 1;
    const n = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : i === 0 ? last : i - 1;
    const next = shown[n];
    if (!next) return;
    setPick(SET_PIECES.indexOf(next));
    stripRefs.current[n]?.focus();
  };

  return (
    <div className={s.cinema}>
      <div className={s.hero}>
        <Plate
          plate={hero.plate}
          clip={hero.clip}
          alt={`${hero.title} — the shot made for it`}
          play
          reducedMotion={reducedMotion}
        />
        {/* The roster index, drawn as an outline and cropped by the frame. It
            is structure, not decoration: it says where in twelve you are. */}
        <span className={s.mark} aria-hidden="true">
          {hero.n}
        </span>

        {/* Text and readout share one bottom-aligned grid, so the paragraph
            and the spec column can never grow into each other. */}
        <div className={s.heroLayer}>
          <div className={s.heroText}>
            <h2>{hero.title}</h2>
            <p>{hero.note}</p>
            <div className={s.heroLinks}>
              {hero.href && (
                <a
                  className={s.doorMain}
                  href={hero.href}
                  {...(hero.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {hero.href.startsWith("/soon") ? "Where this stands" : "Open the project"}
                </a>
              )}
              {hero.appHref && (
                <a className={s.door} href={hero.appHref} target="_blank" rel="noreferrer">
                  {hero.appLabel ?? "Get the app"}
                </a>
              )}
            </div>
          </div>
          <dl className={s.spec}>
            <div>
              <dt>Shelf</dt>
              <dd>{folderOf[hero.title] ?? "tools"}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{hero.status}</dd>
            </div>
            <div>
              <dt>Built with</dt>
              <dd>{hero.tags.join(" / ")}</dd>
            </div>
            <div>
              <dt>Goes to</dt>
              <dd>
                {hero.href?.startsWith("http")
                  ? new URL(hero.href).host
                  : hero.href?.startsWith("/soon")
                    ? "not finished yet"
                    : (hero.href ?? "—")}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className={s.filters} role="group" aria-label="Narrow the roster">
        {FILTERS.map((f) => {
          const n =
            f.key === "all"
              ? SET_PIECES.length
              : SET_PIECES.filter((p) => folderOf[p.title] === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              className={`${s.chip} ${filter === f.key ? s.chipOn : ""}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <i>{String(n).padStart(2, "0")}</i>
            </button>
          );
        })}
      </div>

      <div className={s.strip}>
        {shown.map((p, i) => {
          const on = p === hero;
          return (
            <button
              key={p.n}
              type="button"
              ref={(el) => {
                stripRefs.current[i] = el;
              }}
              className={`${s.thumb} ${on ? s.thumbOn : ""}`}
              aria-pressed={on}
              tabIndex={on ? 0 : -1}
              onClick={() => setPick(SET_PIECES.indexOf(p))}
              onKeyDown={(e) => onStripKey(e, i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.plate} alt="" loading="lazy" decoding="async" />
              <span className={s.thumbNo}>{p.n}</span>
              <span className={s.thumbName}>{p.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── MEDIA — a wall of monitors ────────────────────────────────────────── */

function Media({ reducedMotion }: Pick<RailWindowProps, "reducedMotion">) {
  const wall = useMemo(
    () => [
      ...FILM,
      ...SET_PIECES.map((p) => ({
        id: p.n,
        title: p.title,
        note: "The shot made for this project.",
        plate: p.plate,
        clip: p.clip,
      })),
    ],
    [],
  );
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const playing = wall.find((r) => r.id === open) ?? null;

  /* Escape closes the film before it reaches the window, so one press puts
     the wall back rather than closing the whole room. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <div className={s.wallRoom}>
      <div className={s.wall}>
        {wall.map((r, i) => (
          <button
            key={r.id}
            type="button"
            /* Not a grid of equal squares: every seventh screen is the big
               one, the way a real monitor wall is actually built. */
            className={`${s.screen} ${i % 7 === 0 ? s.screenBig : ""} ${
              open === r.id ? s.screenOn : ""
            }`}
            onClick={() => setOpen(r.id)}
            onPointerEnter={() => setHover(r.id)}
            onPointerLeave={() => setHover((h) => (h === r.id ? null : h))}
            onFocus={() => setHover(r.id)}
            onBlur={() => setHover((h) => (h === r.id ? null : h))}
          >
            <Plate
              plate={r.plate}
              clip={r.clip}
              alt={r.title}
              play={hover === r.id}
              reducedMotion={reducedMotion}
            />
            <span className={s.screenLabel}>
              <i>{String(i + 1).padStart(2, "0")}</i>
              {r.title}
            </span>
          </button>
        ))}
      </div>

      {playing && (
        <div className={s.lightbox} onClick={() => setOpen(null)}>
          <div className={s.lightboxInner} onClick={(e) => e.stopPropagation()}>
            {/* Native controls on purpose: this is the one screen in the site
                where scrubbing, volume and full screen are the point. */}
            <video
              key={playing.id}
              src={playing.clip}
              poster={playing.plate}
              controls
              autoPlay={!reducedMotion}
              loop
              playsInline
            />
            <div className={s.lightboxBar}>
              <span>
                <b>{playing.title}</b> {playing.note}
              </span>
              <button type="button" className={s.door} onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PRODUCTS — the bento ──────────────────────────────────────────────── */

function Products({ reducedMotion }: Pick<RailWindowProps, "reducedMotion">) {
  const open = SET_PIECES.filter((p) => isLive(p) || p.appHref);
  const lead = open[0];
  const rest = open.slice(1);
  if (!lead) return null;

  return (
    <div className={s.bento}>
      <article className={s.bentoLead}>
        <Plate
          plate={lead.plate}
          clip={lead.clip}
          alt=""
          play={false}
          reducedMotion={reducedMotion}
        />
        <div className={s.bentoLeadText}>
          <span className={s.bentoNo}>01</span>
          <h3>{lead.title}</h3>
          <p>{lead.note}</p>
          <div className={s.rowLinks}>
            {lead.appHref && (
              <a className={s.doorMain} href={lead.appHref} target="_blank" rel="noreferrer">
                {lead.appLabel ?? "Get the app"}
              </a>
            )}
            {lead.href && (
              <a
                className={s.door}
                href={lead.href}
                {...(lead.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                Open it
              </a>
            )}
          </div>
        </div>
      </article>

      {rest.map((p, i) => (
        <a
          key={p.n}
          className={`${s.bentoCell} ${i === 0 ? s.bentoCellSig : ""}`}
          href={p.href ?? p.appHref ?? "#"}
          {...(p.href?.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          <span className={s.bentoNo}>{String(i + 2).padStart(2, "0")}</span>
          <span className={s.bentoArrow} aria-hidden="true">
            &#8599;
          </span>
          <h3>{p.title}</h3>
          <Status p={p} />
        </a>
      ))}

      <p className={s.bentoFoot}>
        These are the ones with a door. The other {SET_PIECES.length - open.length}{" "}
        are still being built, and Portfolio shows every one of the{" "}
        {SET_PIECES.length}.
      </p>
    </div>
  );
}

/* ── CONTACTS — the poster ─────────────────────────────────────────────── */

function Contacts({
  email,
  studioHref,
  onEnterStudio,
}: Pick<RailWindowProps, "email" | "studioHref" | "onEnterStudio">) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Clipboard blocked. The address is on screen and the mailto still
         works, so there is nothing to apologise for. */
    }
  }, [email]);

  return (
    <div className={s.poster}>
      <p className={s.posterKicker}>No form. No queue. No assistant.</p>
      <a className={s.posterMail} href={`mailto:${email}`}>
        {email}
      </a>
      <div className={s.posterActs}>
        <button type="button" className={s.posterCopy} onClick={copy}>
          {copied ? "Copied to your clipboard" : "Copy the address"}
        </button>
        <a className={s.posterLink} href={studioHref} onClick={onEnterStudio}>
          Read the written site &#8599;
        </a>
      </div>
      <p className={s.posterWhat}>
        Full app builds &#183; web design &#183; React interfaces &#183; automation
      </p>
    </div>
  );
}

/* ── SETTINGS — the instrument panel ───────────────────────────────────── */

function Switch({
  index,
  label,
  hint,
  offLabel,
  onLabel,
  on,
  onChange,
}: {
  index: string;
  label: string;
  hint: string;
  offLabel: string;
  onLabel: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={s.panelRow}>
      <span className={s.panelNo}>{index}</span>
      <div className={s.panelText}>
        <h3>{label}</h3>
        <p>{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`${s.switch} ${on ? s.switchOn : ""}`}
        onClick={() => onChange(!on)}
      >
        <span className={s.switchTrack} aria-hidden="true">
          <span className={s.switchKnob} />
        </span>
        <span className={s.switchRead}>{on ? onLabel : offLabel}</span>
      </button>
    </div>
  );
}

function Settings({
  dark,
  onToggleTheme,
  compact,
  onSetCompact,
  calm,
  onSetCalm,
}: Pick<
  RailWindowProps,
  "dark" | "onToggleTheme" | "compact" | "onSetCompact" | "calm" | "onSetCalm"
>) {
  return (
    <div className={s.panel}>
      <Switch
        index="A"
        label="Appearance"
        hint="The desktop, its wallpaper and every window follow this."
        offLabel="Light"
        onLabel="Dark"
        on={dark}
        onChange={() => onToggleTheme()}
      />
      <Switch
        index="B"
        label="Desktop icons"
        hint="Big tiles carrying their descriptions, or a tight grid of icons."
        offLabel="Grid"
        onLabel="Icons"
        on={compact}
        onChange={onSetCompact}
      />
      <Switch
        index="C"
        label="Motion"
        hint="Calm stops every animation on the site and keeps all the colour and contrast."
        offLabel="Full"
        onLabel="Calm"
        on={calm}
        onChange={onSetCalm}
      />
      <p className={s.panelFoot}>
        All three are remembered on this device. If your system already asks for
        reduced motion, the site obeys that on its own, whatever is set here.
      </p>
    </div>
  );
}

/* ── GOALS — the spine ─────────────────────────────────────────────────── */

function Goals() {
  /* Building first: the point of this screen is what has not happened yet. */
  const ordered = [
    ...SET_PIECES.filter((p) => p.resolution === "volatile"),
    ...SET_PIECES.filter((p) => p.resolution === "resolved"),
  ];
  const building = SET_PIECES.filter((p) => p.resolution === "volatile").length;

  return (
    <div className={s.spineWrap}>
      <p className={s.spineHead}>
        <b>{building}</b> of {SET_PIECES.length} still to land
      </p>
      <ol className={s.spine}>
        {ordered.map((p) => (
          <li key={p.n} className={p.resolution === "resolved" ? s.tickDone : s.tickOpen}>
            <span className={s.tick} aria-hidden="true" />
            <span className={s.spineName}>{p.title}</span>
            <Status p={p} />
          </li>
        ))}
      </ol>
      <p className={s.panelFoot}>
        One list, split by the roster&#8217;s own status field. Nothing here is
        a target somebody typed: when a project&#8217;s state changes it moves
        up or down this spine on its own.
      </p>
    </div>
  );
}

/* ── REPORTS — the printed table ───────────────────────────────────────── */

function Reports({ folderOf }: Pick<RailWindowProps, "folderOf">) {
  const rows = useMemo(() => {
    const m = new Map<string, { total: number; live: number; shelves: Set<string> }>();
    SET_PIECES.forEach((p) => {
      const e = m.get(p.status) ?? { total: 0, live: 0, shelves: new Set<string>() };
      e.total += 1;
      if (isLive(p)) e.live += 1;
      e.shelves.add(folderOf[p.title] ?? "tools");
      m.set(p.status, e);
    });
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [folderOf]);

  const live = SET_PIECES.filter(isLive).length;

  return (
    <div className={s.sheet}>
      <div className={s.sheetHead}>
        <p>
          Every project on the studio&#8217;s roster, grouped by the state it is
          actually in. Read at the moment you opened this window.
        </p>
        <span className={s.sheetTotal}>
          {SET_PIECES.length}
          <i>on the roster</i>
        </span>
      </div>

      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Shelves</th>
            <th scope="col">Reachable</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([status, e]) => (
            <tr key={status}>
              <th scope="row">{status}</th>
              <td>{[...e.shelves].join(", ")}</td>
              <td>{e.live}</td>
              <td className={s.figure}>{String(e.total).padStart(2, "0")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>apps, games, tools</td>
            <td>{live}</td>
            <td className={s.figure}>{SET_PIECES.length}</td>
          </tr>
        </tfoot>
      </table>

      <p className={s.panelFoot}>
        &#8220;Reachable&#8221; means the project has somewhere real to go
        today. The rest point at a page that says plainly they are not finished,
        rather than at a thin page dressed as a real one.
      </p>
    </div>
  );
}

/* ── the switch ────────────────────────────────────────────────────────── */

export function RailWindowBody(props: RailWindowProps) {
  switch (props.section) {
    case "home":
      return (
        <Home
          onGo={props.onGo}
          email={props.email}
          studioHref={props.studioHref}
          onEnterStudio={props.onEnterStudio}
        />
      );
    case "portfolio":
      return <Portfolio folderOf={props.folderOf} reducedMotion={props.reducedMotion} />;
    case "media":
      return <Media reducedMotion={props.reducedMotion} />;
    case "products":
      return <Products reducedMotion={props.reducedMotion} />;
    case "contacts":
      return (
        <Contacts
          email={props.email}
          studioHref={props.studioHref}
          onEnterStudio={props.onEnterStudio}
        />
      );
    case "settings":
      return (
        <Settings
          dark={props.dark}
          onToggleTheme={props.onToggleTheme}
          compact={props.compact}
          onSetCompact={props.onSetCompact}
          calm={props.calm}
          onSetCalm={props.onSetCalm}
        />
      );
    case "goals":
      return <Goals />;
    case "reports":
      return <Reports folderOf={props.folderOf} />;
  }
}

/* The rooms that run edge to edge on their own black ground. The shell reads
   this to widen the frame and drop its paper tint. */
export const CINEMA: RailKey[] = ["home", "portfolio", "media", "contacts"];
