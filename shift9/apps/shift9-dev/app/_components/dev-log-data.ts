// Public editorial entries, newest first. Keep private source records out of this file.
export const DEV_LOG = [
  {
    n: "Bringing the room closer to the film",
    s: "06 SEP 2026",
    sc: "dev" as const,
    d: "The latest room pass focuses on continuity between the opening film and the room you can explore. The monitor arrangement, printer bay and two-cube Lumen stack were adjusted against the opening still, with the printer on the left and Lumen immediately to the right. This room update is in progress and is being refined before release.",
    tags: ["Studio", "In progress"],
  },
  {
    n: "A different surface for Flow State",
    s: "05 SEP 2026",
    sc: "rnd" as const,
    d: "Flow State’s page moved to an interactive ripple effect, replacing the earlier water surface. The effect responds to the pointer, bending the page around its content where the browser supports it. Other browsers keep the readable page with a lighter visual treatment. The aim is to give the page a sense of water without putting the effect in the way of reading.",
    tags: ["Flow State", "Interface"],
  },
  {
    n: "A clearer path to Feelspoon",
    s: "05 SEP 2026",
    sc: "rnd" as const,
    d: "The Feelspoon hero’s main link was updated to point to Google Play. A small change to the studio page, with a direct purpose: someone interested in the app can get from the introduction to its store listing.",
    tags: ["Feelspoon", "Navigation"],
  },
  {
    "n": "Keeping approved video assets intact",
    "s": "06 SEP 2026",
    "sc": "rnd" as const,
    "d": "The video-production pipeline gained checks that preserve approved covers and distinguish a genuine render retry from a repeated request. Writer fallbacks also continue when a provider returns an unusable reply. The work focuses on keeping an approved video consistent as it moves from writing through rendering.",
    "tags": [
      "Bring Up Desk",
      "Development"
    ]
  },
  {
    "n": "More reliable development checks",
    "s": "06 SEP 2026",
    "sc": "dev" as const,
    "d": "Maintenance work corrected the declared Node runtime requirement, installation dependencies, and the handling of failed self-tests. The aim is a development environment whose setup instructions and reported results agree with what actually runs.",
    "tags": [
      "Shift9 Control Plane",
      "Tooling"
    ]
  },
  {
    "n": "Two stages of video approval",
    "s": "05 SEP 2026",
    "sc": "rnd" as const,
    "d": "Added two stages of video-asset approval to the production workflow. These create explicit review checkpoints before production continues, while keeping the final publication decision with a person.",
    "tags": [
      "Bring Up Desk",
      "Development"
    ]
  },
  {
    "n": "Making the studio easier to find and use",
    "s": "05 SEP 2026",
    "sc": "rnd" as const,
    "d": "Updated the site's robots and sitemap configuration alongside accessibility improvements and lighter font and poster assets. This pass addressed discoverability, navigation, and loading weight within the existing studio experience.",
    "tags": [
      "Studio",
      "Interface"
    ]
  },
  {
    "n": "Taking Flow State toward Linux",
    "s": "03 SEP 2026",
    "sc": "rnd" as const,
    "d": "Introduced a shared interface for platform-specific behavior and began an X11 implementation for Linux. Separating operating-system integration from dictation logic lets the application grow beyond Windows without duplicating its core. This records development progress, not a Linux release.",
    "tags": [
      "Flow State",
      "In progress"
    ]
  },
  {
    "n": "Dictation without stealing the keyboard",
    "s": "03 SEP 2026",
    "sc": "rnd" as const,
    "d": "Added checks that the floating dictation pill does not take keyboard focus away from the application being used. The same work made the test suite less intrusive by avoiding control of the user's screen. For a dictation tool, staying out of the typing workflow is part of the feature.",
    "tags": [
      "Flow State",
      "Development"
    ]
  },
  {
    "n": "A more usable publishing workspace",
    "s": "03 SEP 2026",
    "sc": "dev" as const,
    "d": "Built out the local workspace for drafting and queuing Feelspoon social posts. Changes added publishing connections, image-generation fallbacks, and JPEG output suited to the destination platforms. Removals became undoable and failures became visible, making accidental removals recoverable and failures easier to notice.",
    "tags": [
      "Feelspoon Growth Kit",
      "Tooling"
    ]
  },
  {
    "n": "Bringing video production into one workspace",
    "s": "31 AUG 2026",
    "sc": "rnd" as const,
    "d": "Work on the hardware-video pipeline connected research, scripts, narration, sound, imagery, rendering, and private draft uploads. This pass consolidated the sound kit and image supply. The workflow prepares a video for review; publication remains a separate human decision.",
    "tags": [
      "Bring Up Desk",
      "Development"
    ]
  },
  {
    "n": "Studying how interfaces actually behave",
    "s": "28 AUG 2026",
    "sc": "dev" as const,
    "d": "Organized a reference library of websites with measured visual properties. The library supports research into typography, color, layout, and interaction when developing studio interfaces. References are design-study material, not claims of authorship.",
    "tags": [
      "Design Reference Library",
      "Tooling"
    ]
  },
  {
    "n": "Giving the Vespers enemies distinct identities",
    "s": "26 AUG 2026",
    "sc": "rnd" as const,
    "d": "The game art pass replaced reused recolors with distinct enemy faces and refined the lantern wisp and wax revenant. Related work adjusted damage-number sizing for the game's display and prepared music for its moon phases. These are development milestones in the game's visual and audio identity.",
    "tags": [
      "Vespers",
      "In progress"
    ]
  },
  {
    "n": "Keeping video review available",
    "s": "26 AUG 2026",
    "sc": "dev" as const,
    "d": "Added a fallback sequence for video-capable models so one unavailable provider does not leave a clip unreviewed. Earlier work connected live viewing, screen captures, and short recordings. The purpose is to inspect the rendered result, including motion, rather than infer its appearance from code.",
    "tags": [
      "Agent Vision Tools",
      "Tooling"
    ]
  },
  {
    "n": "Feelspoon reaches Android submission",
    "s": "24 AUG 2026",
    "sc": "rnd" as const,
    "d": "The recipe-organizer project reached a recorded Google Play submission milestone, with feelspoon.app and the studio's product links updated during release preparation. Feelspoon brings recipe saving, hands-free cooking, meal planning, and shopping lists into one product. This entry records the submission date; it does not imply every platform launched that day.",
    "tags": [
      "Feelspoon",
      "Release milestone"
    ]
  },
  {
    "n": "Building a softer learning world",
    "s": "22 AUG 2026",
    "sc": "rnd" as const,
    "d": "Developed a sky world with a shader-driven sky, wool-like assets made in Blender, and floating islands. Further art work refined story pages and character placement. The direction gives the children's learning prototype a consistent, tactile setting across its screens.",
    "tags": [
      "Learning App",
      "In progress"
    ]
  },
  {
    "n": "A clearer art direction for Midnight Returns",
    "s": "22 AUG 2026",
    "sc": "rnd" as const,
    "d": "Added game art, a 3D knight, and a design brief to the Metroidvania project. These assets extend earlier work on animation sheets and deterministic gameplay tests. The entry marks the development of the game's identity, not a finished game release.",
    "tags": [
      "Midnight Returns",
      "In progress"
    ]
  },
  {
    "n": "Making dictation settings easier to tune",
    "s": "22 AUG 2026",
    "sc": "rnd" as const,
    "d": "Added settings for the floating pill alongside a workbench page. The work exposes controls for the small interface used during dictation, so its presentation can be adjusted without treating the whole application as a single fixed layout.",
    "tags": [
      "Flow State",
      "Development"
    ]
  },
  {
    "n": "Comparing a render with a video reference",
    "s": "20 AUG 2026",
    "sc": "dev" as const,
    "d": "Added a review path that compares a local render with a video reference. This extends visual inspection beyond still images: timing and transitions need to be viewed as motion. The tool supports review of the actual output before delivery.",
    "tags": [
      "Agent Vision Tools",
      "Tooling"
    ]
  },
  {
    "n": "Exploring spatial navigation for mission control",
    "s": "16 AUG 2026",
    "sc": "rnd" as const,
    "d": "Prototyped a command interface with WebGL cards, zoom transitions, and a card-to-room dossier interaction. The work explores whether navigation can preserve a sense of place while revealing more detail. It remains interface development, separate from the public studio's room experience.",
    "tags": [
      "Shift9 Control Plane",
      "In progress"
    ]
  },
  {
    "n": "Previewable starting points for sites and games",
    "s": "16 AUG 2026",
    "sc": "dev" as const,
    "d": "Added preview support to reusable project kits and created companion website and game proofs. The focus is checking a starting point before extending it into a project, with visible examples that expose outdated assumptions early.",
    "tags": [
      "Shift9 Forge",
      "Tooling"
    ]
  },
  {
    "n": "Bounded work in a persistent assistant",
    "s": "04 AUG 2026",
    "sc": "dev" as const,
    "d": "Added a time limit to daily debrief processing so a stalled model call cannot block the rest of a knowledge-sync workflow. This is part of the broader work on reusable agent skills, persistent project context, and continuity between development sessions.",
    "tags": [
      "XAVIER",
      "Tooling"
    ]
  },
  {
    "n": "Keeping research attached to video production",
    "s": "03 AUG 2026",
    "sc": "dev" as const,
    "d": "Strengthened source provenance in the video pipeline and added a recurring research component. Related production work made uploads resumable and guarded against duplicate uploads. The aim is to preserve both the research trail and the state of a production run.",
    "tags": [
      "Bring Up Desk",
      "Tooling"
    ]
  },
  {
    "n": "An evidence-first mission-control prototype",
    "s": "01 AUG 2026",
    "sc": "rnd" as const,
    "d": "Built a connected prototype covering mission tracking, a GitHub App connection flow, and an isolated Docker test environment. Work also hardened the live client connection. The design makes evidence and explicit project rules part of the development workflow instead of leaving them only in documentation.",
    "tags": [
      "Vespermesh",
      "Prototype"
    ]
  },
  {
    "n": "A cleaner waitlist flow",
    "s": "01 AUG 2026",
    "sc": "rnd" as const,
    "d": "Work on Flow State's studio page included the waitlist and duplicate-signup handling. The change treats registration as a complete interaction: entering an address should lead to a clear result, including when that address has already been registered.",
    "tags": [
      "Flow State",
      "Interface"
    ]
  },
  {
    "n": "Reusable assets from generation to extraction",
    "s": "29 JUL 2026",
    "sc": "dev" as const,
    "d": "Established an asset library with base bodies and a generate-then-cut workflow. Separating source generation from asset extraction creates reusable pieces for later visual work instead of tying every output to one composition.",
    "tags": [
      "Asset Library",
      "Tooling"
    ]
  },
  {
    "n": "Building the Vespera / KAGE combat prototype",
    "s": "22 JUL 2026",
    "sc": "rnd" as const,
    "d": "The prototype progressed through movement and dashing, pooled enemies and waves, weapons and collisions, and roguelite progression. Later work added boss states, achievements, and a visual overhaul. Object pooling and spatial partitioning support the dense combat scenes this style of game requires.",
    "tags": [
      "Vespera / KAGE",
      "Prototype"
    ]
  },
  {
    "n": "Controlling projection mapping from a phone",
    "s": "15 JUL 2026",
    "sc": "rnd" as const,
    "d": "The project record describes a projection-mapping prototype with corner-pin adjustment and live phone control over WebSocket. A matrix transform fits the projected image to its target surface. This dated project checkpoint documents the approach; it is not a claim of a new release that day.",
    "tags": [
      "Lumen",
      "Prototype"
    ]
  },
  {
    "n": "A local-first dictation workspace",
    "s": "09 JUL 2026",
    "sc": "rnd" as const,
    "d": "The Windows dictation build brought together history, dictionary, audio, appearance, and privacy settings with a tray interface and floating pill. Recovery work retained audio segments for interrupted sessions. The product direction is local speech processing with a compact interface that stays close to the user's writing.",
    "tags": [
      "Flow State",
      "Development"
    ]
  },
  {
    "n": "Separating basketball simulation from presentation",
    "s": "08 JUL 2026",
    "sc": "rnd" as const,
    "d": "A refactoring pass worked on the scene and simulation structure of the Godot basketball project. Its data pipeline connects Python basketball statistics to game data and GDScript, with a player-attribute model and broadcast-style camera foundation. This is ongoing simulation development.",
    "tags": [
      "Hoopclone",
      "In progress"
    ]
  },
  {
    "n": "Testing game rules independently of the scene",
    "s": "06 JUL 2026",
    "sc": "rnd" as const,
    "d": "Added Unity EditMode tests for deterministic systems and an automated test workflow. A related fix updated the boss controller for the Cinemachine namespace. Testing the rules separately gives gameplay changes a repeatable check before they are judged in a running scene.",
    "tags": [
      "Midnight Returns",
      "Development"
    ]
  },
  {
    "n": "Turning interface patterns into working demos",
    "s": "30 JUN 2026",
    "sc": "dev" as const,
    "d": "Expanded the UI workbench with live component demos, landing-page patterns, page transitions, and foil-balloon text. The same pass replaced placeholder snippets and corrected TypeScript and motion-library integration issues. The goal is reusable examples that can be tried and adapted.",
    "tags": [
      "Neon Forge",
      "Tooling"
    ]
  },
  {
    "n": "A basketball prototype with real presentation assets",
    "s": "29 JUN 2026",
    "sc": "rnd" as const,
    "d": "Added court, crowd, and jersey textures alongside a headless launch and screenshot driver. The work brings presentation assets and repeatable inspection into the Godot prototype, supporting development of its simulation and broadcast-style view.",
    "tags": [
      "Hoopclone",
      "In progress"
    ]
  },
  {
    "n": "Guided Windows diagnostics",
    "s": "25 JUN 2026",
    "sc": "rnd" as const,
    "d": "Built a native Windows utility using Flet and asynchronous Python, with guided troubleshooting, a Windows-version readout, and update-repair actions. A later pass added an installation-media action and window controls. This records the utility's development, not a recommendation to run historical repair steps on a current machine.",
    "tags": [
      "WHome Diagnostic Tool",
      "Prototype"
    ]
  },
  {
    "n": "A repeatable sprite-sheet workflow",
    "s": "21 JUN 2026",
    "sc": "dev" as const,
    "d": "Added a sprite-sheet generator covering animation sections and an enemy bestiary. The pipeline supports the game's art production by organizing animation assets into repeatable outputs.",
    "tags": [
      "Midnight Returns",
      "Tooling"
    ]
  },
  {
    "n": "Connecting the stages of a 3D production prototype",
    "s": "19 JUN 2026",
    "sc": "rnd" as const,
    "d": "Implemented providers for silhouette-based voxel drafts, mesh simplification, mesh-integrity checks, skin weights, and animation retargeting. A live dashboard can resume after a dropped connection. These pieces explore a connected 3D workflow; they do not establish a finished end-to-end production suite.",
    "tags": [
      "Omni-3D",
      "Prototype"
    ]
  },
  {
    "n": "Ratings-driven basketball possessions",
    "s": "14 JUN 2026",
    "sc": "rnd" as const,
    "d": "Connected imported player statistics to attributes, ratings-gated moves, passing, drives, defense, and rebounds. Team customization also feeds the scoreboard. This earlier basketball prototype explores how a deterministic simulation can drive both play and presentation.",
    "tags": [
      "Bball",
      "Prototype"
    ]
  },
{
  "n": "A city as a learning interface",
  "s": "23 AUG 2026",
  "sc": "rnd" as const,
  "d": "Advisor's prototype turns learning topics into buildings in an explorable illustrated city. Custom WebGL2 shaders render the setting, while conversation happens inside the interface. This checkpoint includes one sample lesson and a working conversational flow; the broader curriculum remains in development.",
  "tags": [
    "Advisor",
    "Prototype"
  ]
},
{
  "n": "Reviewing the review",
  "s": "12 AUG 2026",
  "sc": "dev" as const,
  "d": "Added an outside review layer that asks what a verdict's evidence actually supports. Separate reviewers examine the judgment, and a bounded review loop prevents repeated review from running indefinitely. This tooling keeps a passing assessment distinct from permission to release a change.",
  "tags": [
    "Independent Review Tools",
    "Tooling"
  ]
},
{
  "n": "An approval inbox for agent-driven work",
  "s": "31 JUL 2026",
  "sc": "rnd" as const,
  "d": "The Gatekeeper prototype brought an approval inbox, a fleet board, and project-rule compilation into one development workflow. It explored making written rules executable and routing changes according to risk. This early project checkpoint sits alongside the work that developed into Vespermesh and the later Control Plane.",
  "tags": [
    "Gatekeeper",
    "Prototype"
  ]
},
{
  "n": "A persistent workspace for specialist agents",
  "s": "02 JUL 2026",
  "sc": "dev" as const,
  "d": "XAVIER's early architecture organized coding, writing, research, and operations into specialist roles with shared project context. Commands for briefings, decisions, and handoffs give that work a repeatable structure. The design separates the assistant's identity and routing rules from the changing state of individual projects.",
  "tags": [
    "XAVIER",
    "Architecture checkpoint"
  ]
},
{
  "n": "From session history to reusable knowledge",
  "s": "02 JUL 2026",
  "sc": "dev" as const,
  "d": "Defined a two-tier knowledge system: active tasks and project state stay in short-term records, while durable lessons become wiki notes linked to their source material. A dedicated ingestion path preserves the original record before distilling it. This architecture supports continuity without treating every conversation as permanent guidance.",
  "tags": [
    "Knowledge System",
    "Architecture checkpoint"
  ]
},
].sort((a, b) => Date.parse(b.s) - Date.parse(a.s));
