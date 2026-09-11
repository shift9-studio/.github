// Public editorial entries, newest first. Keep private source records out of this file.
export const DEV_LOG = [
  {
    n: "Freezing a golden dataset before comparing models",
    s: "01 SEP 2026",
    sc: "dev" as const,
    d: "Established 50 seed evaluation cases across five model job classes, with exact-answer, contains, schema and rubric-based scoring. Case hashes make the dataset add-only: changed or missing cases fail validation instead of quietly improving an average. The runner starts the bridge from the configuration under test and records a result for every case. Added a separate set of 50 retrieval cases against a frozen document corpus, so answer quality and retrieval quality can be measured without moving the reference material between runs.",
    tags: ["Shift9 Control Plane", "Golden datasets"],
  },
  {
    n: "Making LLM-as-judge rubrics versioned and inspectable",
    s: "02 SEP 2026",
    sc: "dev" as const,
    d: "Separated answer-rubric grading from retrieval grading with immutable, versioned system prompts and an explicit prompt registry. General grading returns pass and a reason; retrieval grading returns separate faithfulness and relevance verdicts in one structured response. This repaired a real mismatch where the judge followed a pass/fail system prompt while the evaluator expected different fields. Missing or malformed judgments retain their failure reason. The design makes grading criteria inspectable and keeps retrieval support distinct from whether an answer addresses the question.",
    tags: ["Shift9 Control Plane", "LLM as a judge"],
  },
  {
    n: "Keeping model decisions traceable to their inputs",
    s: "01 SEP 2026",
    sc: "dev" as const,
    d: "Added a SQLite trace store that references deduplicated prompts by SHA-256 rather than copying prompt text into every request record. Traces retain model and provider identity, latency, token usage, fallback activity, cache state and schema-repair history; strings pass through redaction before storage. Task identifiers and loaded-kit receipts connect model calls to the work that requested them. Versioned prompt pins preserve the wording behind an older result, providing a concrete audit trail for later evaluation and debugging.",
    tags: ["Shift9 Control Plane", "LLM observability"],
  },
  {
    n: "Combining lexical and semantic retrieval in SQLite",
    s: "01 SEP 2026",
    sc: "dev" as const,
    d: "Built a hybrid RAG index using SQLite FTS5 for keyword matching and sqlite-vec for vector similarity. Reciprocal Rank Fusion combines both rankings at k=60, producing 30 candidates before reranking selects five passages. Hash-based ingestion updates changed files, while source paths, line ranges and heading metadata remain attached to chunks. Repository, project, path-prefix and time filters constrain retrieval. Embedding and reranking use the same model bridge as generation, keeping provider routing outside the retrieval implementation.",
    tags: ["Shift9 Control Plane", "Hybrid RAG"],
  },
  {
    n: "Enforcing citations at the answer boundary",
    s: "02 SEP 2026",
    sc: "dev" as const,
    d: "Made the RAG answer path require a structured answer and citations drawn only from the passages actually supplied. Empty citations, unknown references, malformed replies and empty retrieval replace the answer with NOT_FOUND and retain a diagnostic reason. Numbered passage tokens resolve back to stable chunk IDs in code, removing hash-transcription errors without expanding the set of acceptable sources. Tests exercise valid, missing, out-of-range and out-of-context references. Citation membership establishes traceability; semantic faithfulness remains a separate evaluation.",
    tags: ["Shift9 Control Plane", "Grounded generation"],
  },
  {
    n: "Recording retrieval scores without hiding answer failures",
    s: "02 SEP 2026",
    sc: "dev" as const,
    d: "The archived 50-case RAG evaluation recorded 100% context recall, 98.8% context precision, 98% judged faithfulness and 100% answer relevance, with all 50 cases measured for each metric. Those recorded values exceeded the configured floors of 80%, 80%, 90% and 85%. The same run's separate direct-answer pass scored 29 of 60; its retrieval-oriented questions were asked without supplied passages and exposed unsupported answers. These are distinct test paths and a dated measurement, not a claim that the complete system passed or that current evaluation integrity has been established.",
    tags: ["Shift9 Control Plane", "RAG evaluation"],
  },
  {
    n: "Turning release requirements into twelve executable gates",
    s: "01 SEP 2026",
    sc: "dev" as const,
    d: "Implemented an ordered twelve-gate workflow spanning specification checks, test evidence, mutation testing, competitive comparison, adversarial review, static analysis, visual inspection and release controls. The phase's conformance record reports all twelve passing. A real integration fault surfaced when Git environment variables inherited from a hook made checks inspect the wrong repository; a shared child-process environment fix was then verified under the same inherited variables. Gate execution now has a recorded task and result rather than relying on an agent's statement that checks were run.",
    tags: ["Shift9 Control Plane", "Quality gates"],
  },
  {
    n: "Shadow-testing changes before moving a model configuration",
    s: "02 SEP 2026",
    sc: "dev" as const,
    d: "Built a candidate workflow that clusters recorded failures by reason, proposes one configuration variable at a time and compares the candidate against a pinned baseline. Its promotion checks compare golden-set improvement, previously passing cases and replay quality. Shadow traces are marked to distinguish them from production traffic, and a rollback path can restore the previous pin. A later review identified gaps in how incomplete retrieval and replay evidence reaches the promotion decision; those checks need repair before this can be described as a fully enforced release boundary. This entry records the workflow's implementation, not complete system clearance.",
    tags: ["Shift9 Control Plane", "Evaluation-driven orchestration"],
  },
  {
    n: "Converting repaired production failures into regression cases",
    s: "02 SEP 2026",
    sc: "dev" as const,
    d: "Connected production trace scoring to add-only golden-dataset growth. A case qualifies only when the same input first scores below its floor and later scores above it after a promotion, avoiding the mistake of treating an ordinary lucky retry as a proven repair. New cases assert the absence of the recorded defect through a schema check or targeted rubric, rather than memorizing the successful answer. Existing case hashes remain protected, preserving the regression set while adding evidence from actual failure patterns.",
    tags: ["Shift9 Control Plane", "Regression learning"],
  },
  {
    n: "Repairing orchestration routes against installed capabilities",
    s: "28 AUG 2026",
    sc: "dev" as const,
    d: "Audited a task router that directed work to six harnesses that did not yet exist. The repaired router selects installed capabilities and reports a broken route when a target disappears. The recorded ten-prompt check moved from seven failures to ten passes, with an intentionally broken route proving the check could fail. Shared model tools also gained a start-if-down gateway path, verified by recovering a stopped gateway and receiving a real model answer from outside the project directory. This establishes the dated routing repair, not blanket availability of every later capability.",
    tags: ["Shift9 Control Plane", "Agent orchestration"],
  },
  {
    n: "Testing external data before it reaches the application",
    s: "06 JUL 2026",
    sc: "dev" as const,
    d: "Added network-free provider-data regressions to an earlier media-tooling project. Fixtures cover paginated Spotify metadata, missing and null records, Unicode fields and error propagation, alongside SoundCloud record hydration, order preservation and playlist deduplication. The tests exercise normalization at the integration boundary without depending on live accounts or provider availability. This is historical work in a retired project, retained here as an engineering milestone rather than an active product claim.",
    tags: ["Integration Tooling", "Historical milestone"],
  },
  {
    n: "Building family relationships from cited records",
    s: "05 SEP 2026",
    sc: "rnd" as const,
    d: "Extended the KinQuest genealogy prototype toward automatic record-page reading and recursive discovery through explicit relationship statements in obituaries. The research model distinguishes candidate matches from supported relationships, retains source evidence and supports person-centered trees. A saved development checkpoint reconstructed a small cited relationship graph and added sibling-record expansion. The complete name-to-extended-tree workflow remains unfinished and these changes were not deployed. The engineering focus is evidence-preserving discovery without presenting a name match as a proven family connection.",
    tags: ["KinQuest", "Research prototype"],
  },
  {
    n: "Measuring a horde simulation on integrated graphics",
    s: "03 AUG 2026",
    sc: "rnd" as const,
    d: "Built Vespers' horde combat around batched MultiMesh rendering and packed enemy data rather than one scene node per enemy. The August 3 packaged Windows benchmark recorded 905 peak enemies and 430 simultaneous effects over a 14-second run, averaging 251.3 FPS on Intel Iris Xe at a 1280 × 720 window with the game's lower internal rendering resolution. The report identifies the executable so packaged and editor results cannot be conflated. This is a dated, controlled benchmark of the prototype, not a guarantee for every scene or device.",
    tags: ["Vespers", "Performance engineering"],
  },
  {
    n: "Learning speech corrections only after review",
    s: "14 JUL 2026",
    sc: "rnd" as const,
    d: "Added a local accuracy-learning pipeline to Flow State. Token-level diffs extract short replacements only inside the trusted dictated range; ordinary insertions and deletions are excluded so general editing is not mislearned as a speech correction. Candidates enter a pending, approved or rejected review state, and only approved mappings affect later text. An atomic local store and feature, runtime and Hub regression tests cover the path. Personalization stays explicit and reviewable instead of silently rewriting the user's vocabulary.",
    tags: ["Flow State", "Speech tooling"],
  },
  {
    n: "Recovering dictation after an interrupted session",
    s: "12 JUL 2026",
    sc: "rnd" as const,
    d: "Introduced an append-only JSONL recovery journal for Flow State's partial transcripts. Each event is flushed and fsynced before returning, while validated session IDs and path containment keep recovery operations inside the owned directory. Interrupted sessions can be reconstructed from surviving events, including when a malformed line is present; completed sessions remove their own journal. Regression tests cover reconstruction and refusal to delete outside the recovery area. The journal provides a durable checkpoint before the final transcript reaches normal history.",
    tags: ["Flow State", "Recovery engineering"],
  },
  {
    n: "Shipping store-listing changes as a verified transaction",
    s: "06 SEP 2026",
    sc: "rnd" as const,
    d: "Built Feelspoon's Google Play listing update around the Developer API's edit transaction. The tool validates copy limits, replaces screenshots slot by slot, reads the listing back and commits only when the returned state matches; a failed verification discards the edit. A companion compositor produces captioned phone, seven-inch and ten-inch tablet frames from app captures, with device-specific crops. The September 6 listing update was pushed through this path, replacing an unreliable browser-edit workflow with repeatable validation.",
    tags: ["Feelspoon", "Release engineering"],
  },
  {
    n: "Making agent context an executable contract",
    s: "08 SEP 2026",
    sc: "dev" as const,
    d: "Hardened Vespermesh's Claude Code and Codex review adapters so they receive the current operating rules and inventory, with source receipts, separately from untrusted repository content. Missing, oversized or changed context blocks dispatch; changes during a review prevent its result from being accepted. The local suite passed 59 tests, and the compiled Control Plane integration passed six checks. Removing the operating text made both adapter tests fail. These are isolated execution proofs; live-provider review remains a separate check.",
    tags: ["Vespermesh", "LLM hardening"],
  },
  {
    n: "Testing the boundaries of a local publishing tool",
    s: "08 SEP 2026",
    sc: "dev" as const,
    d: "Hardened the Feelspoon Growth Kit's local HTTP boundary with Host and Origin validation, loopback-only listening, restricted editable fields and escaped HTML attributes and image values. Two regression suites included 32 isolated HTTP requests and failures against the old implementation. After activation, real requests returned 200 for the local page and 403 for invalid Host or Origin values. The four content stores remained byte-identical, and publishing still requires owner approval.",
    tags: ["Feelspoon Growth Kit", "Security"],
  },
  {
    n: "Hardening projection control at the network boundary",
    s: "08 SEP 2026",
    sc: "rnd" as const,
    d: "Repaired Lumen's HTTP sibling-directory traversal, malformed Range handling and null WebSocket-message crash, alongside an Electron runtime update. Regression coverage exercises real network requests and archive-extraction escape attempts. Both existing renderer pages then loaded in an isolated Electron smoke test that exercised pairing, blackout and the homography controls used for corner-pin projection, with no renderer errors. This verifies the local software paths; projector, media and hotplug testing remain open.",
    tags: ["Lumen", "Security"],
  },
  {
    n: "Patching the mobile bundler without changing the app framework",
    s: "08 SEP 2026",
    sc: "rnd" as const,
    d: "Updated Feelspoon's compatible Metro dependency family to remove a vulnerable image decoder without changing Expo, React Native or the app's declared dependencies. The installed-project audit moved from five high-severity findings to zero high; 19 moderate findings remain. A new pretest runs Metro's real PNG dimension, metadata and asset-hash pipeline, rejects malformed input and fails against the old decoder. All 15 Jest tests and TypeScript passed locally. A native build and release are separate milestones.",
    tags: ["Feelspoon", "Dependency security"],
  },
  {
    n: "Binding image approval to the assets actually reviewed",
    s: "08 SEP 2026",
    sc: "dev" as const,
    d: "The video pipeline now derives picture-approval status from a complete, matching approval record rather than the existence of a PNG. Generation requests the target aspect ratio without stretching returned pixels, preserves replaced identity seeds, and resumes only failed shots. Complete image sets can reach owner review with visible quality warnings; incomplete sets still stop, and exact hash-bound owner approval gates the build. The standard suite passed 981 tests, with two skipped and one deselected. The current episode's clips and final render are still pending.",
    tags: ["Bring Up Desk", "Production integrity"],
  },
  {
    n: "Giving image generation a second provider path",
    s: "07 SEP 2026",
    sc: "dev" as const,
    d: "Extended the still-image tool to fall back from Google's exhausted quota to Hugging Face Inference Providers, using provider-specific model mappings and response handling. A real fallback produced a 1152 × 768 PNG in 4.4 seconds, followed by a successful two-image Growth Kit batch. The path uses inference-provider allocation rather than the separate GPU allocation reserved for video. This adds a measured recovery route while keeping resource accounting explicit.",
    tags: ["Agent Media Tools", "Provider resilience"],
  },
  {
    n: "Proving a fresh LLM response is actually fresh",
    s: "06 SEP 2026",
    sc: "dev" as const,
    d: "Traced repeated LLM answers to the internal bridge cache: the caller requested fresh inference, but its flag never reached the bridge and cached replies were labeled fresh. The fix propagates freshness across the HTTP boundary, reports cache age and distinguishes idempotent replay from a cache miss. Fresh callers now require positive provider-attempt evidence and reject stale rescue, replay or missing evidence. A deliberately misleading fake bridge exercises 19 checks, including stripped headers; ten failed before the fix. Live repeat-request probes then confirmed the repaired path.",
    tags: ["Shift9 Control Plane", "LLM hardening"],
  },
  {
    n: "Verifying dependency repairs through native image processing",
    s: "06 SEP 2026",
    sc: "dev" as const,
    d: "Prepared a targeted security update for both studio web apps, covering Next.js, PostCSS and Sharp's native image stack. A build gate resolves the installed packages, enforces patched version floors and invokes Next's actual PNG, JPEG, WebP and AVIF optimizer paths. The original PostCSS installation failed the gate; the patched tree passed all four conversions, both production builds and a zero-finding dependency audit. This is verified local build work, pending deployment; Windows native-library checks do not establish cross-platform behavior.",
    tags: ["Studio", "Dependency security"],
  },
  {
    n: "Separating model identity from provider availability",
    s: "05 SEP 2026",
    sc: "dev" as const,
    d: "Refactored the shared model layer beneath 27 existing callers to support multiple provider routes without rewriting their call sites. Live catalogues supply model availability and capability data; substitutions return resolvedFrom instead of silently changing identity. The independent-review lineage guard now rejects unknown model families and cross-family fallbacks. A catalogue check was driven red with a retired model ID, then restored green. Chat models and embedding endpoints are checked separately so an unavailable catalogue is not mistaken for a missing model.",
    tags: ["Shift9 Control Plane", "LLM infrastructure"],
  },
  {
    n: "Turning session history into a checked knowledge index",
    s: "05 SEP 2026",
    sc: "dev" as const,
    d: "Built a repeatable triage pass over 537 captured sessions to recover decisions, corrections and failure patterns instead of indexing entire conversations as guidance. The pass identified 133 sessions carrying signal and recovered 126 earlier user statements; a second run recovered nothing again. A generated, tagged contents page connects notes to their source locations, while drift checks rebuild and compare it. Duplicate detection also checks bodies and repository ownership, avoiding false matches between similarly titled lessons or cross-repository paths.",
    tags: ["Knowledge System", "Agent memory"],
  },
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
    "d": "Repaired the Control Plane's runtime declaration, reproducible installation path and self-test failure reporting. The LLM fallback tests also gained explicit bridge isolation and an empty credential-store fixture after routing changes had sent supposed test calls to real providers. The isolated fallback suite passed 26 checks. By the September 8 follow-up, the full local run passed 1,007 server checks and 21 required repair suites with no skips, while keeping installed-hook and live-provider verification distinct from offline test results.",
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
    "d": "Moved 28 operating-system call sites out of Flow State's dictation and Hub modules into a shared platform interface, then began the Linux X11 implementation. Windows APIs, hotkeys and registry access now sit behind that boundary instead of being interleaved with speech and interface logic. The recorded Windows suite passed 226 tests, including 25 platform-layer checks. Linux support remains in progress; the abstraction and Windows regression results are not a Linux release claim.",
    "tags": [
      "Flow State",
      "In progress"
    ]
  },
  {
    "n": "Dictation without stealing the keyboard",
    "s": "03 SEP 2026",
    "sc": "rnd" as const,
    "d": "Added a native focus regression for Flow State's floating dictation pill: read the WS_EX_NOACTIVATE window style back from the live window, then type real keys into another window while the pill is visible. This checks the behavior a screenshot cannot establish: dictation controls must not intercept the user's typing. Related test isolation keeps routine suite execution from taking over the working screen. The result is a concrete Windows integration check around the application's least intrusive interface.",
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
