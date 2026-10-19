export type Project = {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  year: string;
  role: string;
  accent: string;
  externalUrl: string;
  externalLabel: string;
  tagline: string;
  description: string;
  note: string;
  hero: {
    src: string;
    displaySrc?: string;
    alt: string;
    width: number;
    height: number;
    fit?: "cover" | "contain";
    position?: string;
    /** Crop into the most telling part of a full-page screenshot. */
    zoom?: number;
    /** Frame shape for stills that are not 16:10, e.g. "2.39 / 1" for scope film. */
    aspect?: string;
    repeatInGallery?: boolean;
  };
  leadMedia?: number[];
  featuredFilm?: {
    title: string;
    format: string;
    description: string;
    /** Either a YouTube film or a self-hosted file in /public. */
    youtubeId?: string;
    src?: string;
    url: string;
    linkLabel?: string;
    poster?: string;
  };
  livePreview?: { url: string; label: string; note: string };
  /** An earlier generation of the same product, shown as its own chapter. */
  predecessor?: {
    eyebrow: string;
    title: string;
    version: string;
    description: string;
    url: string;
    linkLabel: string;
    image: { src: string; displaySrc?: string; alt: string; width: number; height: number };
    lessons: { title: string; body: string }[];
  };
  /** The shipping version, shown as a chip in the hero that jumps to the timeline. */
  currentRelease?: { version: string; headline: string };
  /** Every shipped version, oldest first, rendered as a timeline. */
  versions?: {
    eyebrow: string;
    title: string;
    description: string;
    releases: { version: string; date: string; title: string; highlights: string[] }[];
  };
  caseStudy?: {
    summary: string;
    problem: string;
    exactRole: string;
    collaboration: string;
    decisions: string[];
    constraints: string[];
    results: string[];
    built: string[];
  };
  model?: {
    /** Oversized watermark word behind the section. */
    mark?: string;
    eyebrow: string;
    title: string;
    version: string;
    description: string;
    principles: { title: string; body: string }[];
  };
  features: { title: string; body: string }[];
  media: { type: "image" | "video" | "youtube"; src: string; displaySrc?: string; alt: string; caption?: string; portrait?: boolean; width?: number; height?: number; chrome?: boolean; poster?: string; gallery?: boolean }[];
};

export const projects: Project[] = [
  {
    slug: "folio",
    title: "Folio",
    shortTitle: "Folio",
    category: "AI · Education",
    year: "2026",
    role: "Product, design & engineering",
    accent: "indigo",
    externalUrl: "https://folio.university",
    externalLabel: "Open Folio",
    tagline: "Describe a course. Folio writes all of it.",
    description: "Say what you teach, in a line. Folio asks only what the line left out, outlines the course for you to change, then writes every material for every lesson, checked before it reaches you.",
    note: "Your course, bound together. No sign-up needed to start.",
    hero: { src: "/media/projects/folio-home.png", displaySrc: "/media/optimized/folio-home.webp", alt: "Folio homepage asking “What do you want to teach?” with a four-lesson statistics brief typed in", width: 1440, height: 900, position: "50% 34%", zoom: 1.7 },
    featuredFilm: {
      title: "Folio",
      format: "Product film · 1:56 · 4K",
      description: "Sociology, calculus, and algorithms, each a real build on the live site, shown faster. One line in; every material out.",
      youtubeId: "nvdMP4tHG0I",
      url: "https://youtu.be/nvdMP4tHG0I",
      poster: "/media/optimized/folio-map.webp",
    },
    livePreview: { url: "https://folio.university", label: "Build a course here", note: "Describe your course, or open a sample course. No sign-up needed to start." },
    caseStudy: {
      summary: "Write the whole course. Show what was checked, and what is yours to check.",
      problem: "EduTool proved teachers want a whole course, not a wall of AI text. But its materials were written side by side, so one edit could leave the rest quietly out of date, and a single small model could only check so much.",
      exactRole: "Product strategy, UX, design system, architecture, AI pipeline, front-end, film, and release.",
      collaboration: "Independent. Designed, built, and shipped end to end.",
      decisions: [
        "Every material is built from one course document, so a change knows what it affects.",
        "Ask clarifying questions only when the brief is unclear. A clear brief gets none.",
        "Split the work between models: one writes, a second reviews every plan.",
        "Answers are computed by a program, and R and Python code is actually run.",
      ],
      constraints: [
        "Built for North American classrooms; courses are written in English.",
        "Software checks are not classroom readiness, so each lesson carries a “Yours to check” list.",
        "Real models cost money: Folio credits, your own key, or a local model.",
      ],
      results: [
        "Live at folio.university, at v0.0.43.",
        "A 15-lesson course builds in about four to seven minutes.",
        "Exports to Word, native PowerPoint, PDF, Google Docs, and QTI, with separate student and teacher copies.",
        "1,176 unit tests and 167 browser tests, under a 150 KB first-load budget.",
      ],
      built: [
        "Course schema, change tracking, history and undo, and cross-material checks.",
        "Multi-model pipeline, credits, sync, and the release pipeline.",
        "The “paper and ink” design system, every screen, the exporters, and the launch film.",
      ],
    },
    model: {
      mark: "Folio",
      eyebrow: "HOW IT HOLDS TOGETHER",
      title: "Checked, then yours",
      version: "V0.0.43",
      description: "Folio shows what a program worked out, and what is yours to check. Every word stays yours to change.",
      principles: [
        { title: "Asks first", body: "Clarifying questions only when the brief leaves something out. Then an outline you change before anything is written." },
        { title: "Two models", body: "One writes the course. A second reviews every lesson plan before you see it." },
        { title: "Worked, not guessed", body: "Numbers are computed by a program. Code on a slide is actually run." },
        { title: "Changes ripple", body: "Edit one thing and what depends on it is marked for updating. Your own edits are kept." },
      ],
    },
    features: [
      { title: "Every material, every lesson", body: "Syllabus, lesson plans with minutes and notes, slides, handouts, assignments and rubrics, quiz bank, discussions, study guides, and FAQ." },
      { title: "Slides that teach", body: "Tables, charts, step chains, side-by-side comparisons, and methods shown as they run." },
      { title: "Ask for a change in words", body: "⌘K edits the whole course and shows what it will write, and what that costs, first." },
    ],
    media: [
      { type: "image", src: "/media/projects/folio-map.png", displaySrc: "/media/optimized/folio-map.webp", alt: "Folio course map: four lessons as rows, materials as colour-tabbed columns", caption: "The map: every lesson against every material.", width: 1440, height: 900 },
      { type: "image", src: "/media/projects/folio-lesson.png", displaySrc: "/media/optimized/folio-lesson.webp", alt: "A Folio lesson plan with key ideas and a timed warm-up, teach, and practice sequence with teacher notes", caption: "One lesson, in teaching order, planned to the minute.", width: 1440, height: 900 },
      { type: "image", src: "/media/projects/folio-slides.png", displaySrc: "/media/optimized/folio-slides.webp", alt: "Folio slide deck with a filmstrip of slides, a title slide on stage, and speaker notes", caption: "Slides: filmstrip, stage, and speaker notes kept to the teacher copy.", width: 1440, height: 900 },
      { type: "image", src: "/media/projects/folio-quiz-dark.png", displaySrc: "/media/optimized/folio-quiz-dark.webp", alt: "Folio quiz bank in dark mode with a multiple-choice question and its teacher-only explanation", caption: "The quiz bank, dark. Student copies never carry answers.", width: 1440, height: 900 },
    ],
    predecessor: {
      eyebrow: "THE FIRST GENERATION",
      title: "EduTool.dev",
      version: "V0.20.08",
      description: "Folio began as EduTool: one description in, ten linked materials out, checked by Scion, a model that ran privately in the browser.",
      url: "https://edutool.dev",
      linkLabel: "Visit EduTool.dev",
      image: { src: "/media/projects/edutool-generation.png", displaySrc: "/media/optimized/edutool-generation.webp", alt: "EduTool workspace showing a lesson plan with objectives, source evidence, a timed warm-up, and the session outline", width: 1800, height: 1125 },
      lessons: [
        { title: "What it proved", body: "Teachers want a whole course, not a wall of AI text, and their own poems, dialogues, and data must stay verbatim." },
        { title: "What it taught", body: "Materials written side by side drift apart, and one small model can only check so much. Folio fixes both." },
        { title: "What carried over", body: "Ten materials, one brief, computed answers, and honesty about what still needs a teacher’s review." },
      ],
    },
  },
  {
    slug: "surge-method",
    title: "Surge Method",
    shortTitle: "Surge",
    category: "iOS · Health & Fitness",
    year: "2026",
    role: "Concept, product, design & iOS",
    accent: "blue",
    externalUrl: "https://apps.apple.com/us/app/surge-method/id6758555101",
    externalLabel: "View on the App Store",
    tagline: "More reps. Less burnout.",
    description: "Two ways to train anything you can count or hold. SURGE is a wave: push sets climb, recovery sets drop, all the way to your peak. CLIMB starts with your biggest set, steps down, and grows session by session.",
    note: "No account. No internet. No data collection. History stays on-device.",
    currentRelease: { version: "1.4", headline: "CLIMB for holds" },
    hero: { src: "/media/surge/surge-fire.png", displaySrc: "/media/optimized/surge-fire.webp", alt: "Surge Method 1.4: the last set of a push-up CLIMB, six reps past the goal, the ring on fire", width: 1320, height: 2868, fit: "contain" },
    model: {
      mark: "1.4",
      eyebrow: "TWO METHODS",
      title: "A wave, or a climb",
      version: "V1.4",
      description: "Pick the method per activity, in REPS or TIME. Surge remembers each one’s plan and your peak.",
      principles: [
        { title: "SURGE", body: "Warm up, then push sets climb while recovery sets drop, up to one peak set. More total work without burning out." },
        { title: "CLIMB", body: "Five descending sets with timed rest. Rate it Easy, Good, or Hard and the plan adapts. Each block ends in a test." },
        { title: "Reps or holds", body: "Push-ups and squats, or planks, hangs, and wall sits. Since 1.4, both methods work for both." },
        { title: "Past the goal", body: "Beat the last set’s target and the ring catches fire. Every extra rep or second feeds it." },
      ],
    },
    versions: {
      eyebrow: "VERSION HISTORY",
      title: "From a wave to a climb",
      description: "Five releases in nine months, each on the App Store. One wave grew into a plan that keeps climbing.",
      releases: [
        { version: "1.0", date: "Jan 2026", title: "The Surge wave", highlights: ["Push sets climb, recovery sets drop, up to your peak.", "Reps or time, from one target.", "A private log for every activity."] },
        { version: "1.1", date: "May 2026", title: "Juicier motion", highlights: ["Springy sets, wave bars, and transitions.", "A boss entrance for the peak set.", "A 3·2·1 count-in for timed sets."] },
        { version: "1.2", date: "Sep 2026", title: "CLIMB arrives", highlights: ["Descending sets that adapt to Easy, Good, or Hard.", "Find your max in one all-out set.", "Hands-free push-ups, counted by the front camera."] },
        { version: "1.3", date: "Oct 2026", title: "Beyond the app", highlights: ["Rest on the Lock Screen and in the Dynamic Island.", "A Home Screen widget for the next session.", "Share cards, a rest dial, and a spoken 3, 2, 1."] },
        { version: "1.4", date: "Oct 2026", title: "CLIMB for holds", highlights: ["TIME gets CLIMB: planks, hangs, wall sits.", "Past the goal, the ring catches fire.", "Push-ups count a little deeper."] },
      ],
    },
    caseStudy: {
      summary: "Make progress obvious while you are moving, and keep it growing after day one.",
      problem: "Most workout apps either prescribe a flat plan or just count. Surge 1.0 turned one target into a wave anyone could follow mid-set, but a wave doesn’t tell you what to do next week. The app had to keep you climbing without ever needing an account.",
      exactRole: "Concept, training system, UX, visual design, sound, iOS engineering, testing, App Store assets, and release.",
      collaboration: "Independent. Designed, built, and shipped solo.",
      decisions: [
        "Two methods, not one: the SURGE wave for a single session, CLIMB for a plan that grows.",
        "One deterministic engine for reps and holds, tested from a baseline of 3 to 150.",
        "Sound, haptics, and the press ball carry state, so you never read the screen mid-rep.",
        "Missed sessions never step you back; a week off just holds the plan.",
      ],
      constraints: [
        "Camera counting needs TrueDepth hardware, so it is offered only for push-ups.",
        "The first sound of a session hissed on device; the audio graph was rebuilt twice.",
        "Offline privacy ruled out accounts, sync, and cloud planning.",
      ],
      results: [
        "On the App Store, at version 1.4.",
        "Five releases from January to October 2026.",
        "SURGE and CLIMB in both REPS and TIME, with a widget, Live Activity, and share cards.",
        "284 automated tests; App Privacy stays “Data Not Collected”.",
      ],
      built: [
        "The wave planner, the CLIMB engine, and the rep, hold, tap, and camera counters.",
        "Every screen, the press ball and fire ring, and the synthesized sound.",
        "Widgets, Live Activities, store screenshots, privacy policy, and each release.",
      ],
    },
    features: [
      { title: "Hands-free push-ups", body: "Put the phone under your face. The front camera counts every rep. Nothing is recorded." },
      { title: "Rest you can see", body: "Turn the dial to change it. It counts down on the Lock Screen too." },
      { title: "Share your wins", body: "A card for every workout: each set, your total, and how far you’ve climbed." },
    ],
    media: [
      { type: "image", src: "/media/surge/surge-wave-setup.png", displaySrc: "/media/optimized/surge-wave-setup.webp", alt: "Surge Method setup: SURGE in REPS, peak set 12, the wave of twelve sets previewed", caption: "SURGE: set a peak. See the wave.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-push-set.png", displaySrc: "/media/optimized/surge-push-set.webp", alt: "A Surge push set of 7 reps, set 2 of 12, with the wave below", caption: "Every set has a job.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-holds-setup.png", displaySrc: "/media/optimized/surge-holds-setup.webp", alt: "TIME · CLIMB setup for Plank: five descending holds, step 6 of 12", caption: "New in 1.4: CLIMB for holds.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-hold.png", displaySrc: "/media/optimized/surge-hold.webp", alt: "A plank hold at 0:36, set 1 of 5", caption: "Holds close themselves.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-rest-dial.png", displaySrc: "/media/optimized/surge-rest-dial.webp", alt: "Rest dial counting down from 1:24 with set 2 coming up", caption: "Turn the ring to change your rest.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-holds-complete.png", displaySrc: "/media/optimized/surge-holds-complete.webp", alt: "Plank CLIMB complete, rated Good, with the next session previewed", caption: "Rate it. The plan adapts.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-stats.png", displaySrc: "/media/optimized/surge-stats.webp", alt: "Push-up activity stats: baseline 27, goal 41, a chart of tests and session volume", caption: "Watch your baseline climb.", portrait: true, width: 1320, height: 2868 },
      { type: "image", src: "/media/surge/surge-share-card.png", displaySrc: "/media/optimized/surge-share-card.webp", alt: "A share card: new best, 55 push-ups over five sets", caption: "A card for every win.", portrait: true, width: 1320, height: 2868 },
    ],
  },
  {
    slug: "bebop-puzzle",
    title: "Bebop Puzzle",
    shortTitle: "Bebop",
    category: "Game · Music Theory",
    year: "2025—2026",
    role: "Game design, sound & engineering",
    accent: "violet",
    externalUrl: "https://beboppuzzle.com",
    externalLabel: "Play Bebop Puzzle",
    tagline: "Learn the language of jazz with your hands.",
    description: "Build bebop lines by touch. Connect four-note pieces across a chord grid and hear every decision through a Rhodes-inspired instrument.",
    note: "6 chapters. 80 levels. Daily missions. Composer Mode. Printable board game.",
    hero: { src: "/media/projects/bebop-live.png", displaySrc: "/media/optimized/bebop-live.webp", alt: "Bebop Puzzle chord grid with melodic pieces ready to connect", width: 1800, height: 1125, position: "50% 40%", zoom: 1.5 },
    leadMedia: [0],
    livePreview: { url: "https://beboppuzzle.com", label: "Play Bebop Puzzle here", note: "Drag the pieces. Hear the line. Play the full campaign." },
    caseStudy: {
      summary: "Turn theory into play without flattening the music.",
      problem: "Jazz theory often starts with notation and jargon. Bebop Puzzle had to make voice leading, approaches, and enclosures tangible—without becoming a worksheet.",
      exactRole: "Game rules, learning design, UX, sound, web engineering, levels, and release.",
      collaboration: "Independent. Built the game, audio, content, and release.",
      decisions: [
        "Turn jazz vocabulary into four-note pieces with clear connection rules.",
        "Play every move instantly through a Rhodes-inspired instrument.",
        "Stretch one mechanic from lessons to composing, missions, and print.",
      ],
      constraints: [
        "Early concepts felt like worksheets with decorative sound.",
        "A valid connection could still sound weak.",
        "Drag and audio had to survive desktop, touch, and browser policies.",
      ],
      results: [
        "Live at beboppuzzle.com.",
        "Ships 6 chapters, 80 levels, daily missions, and Composer Mode.",
        "The same system works as a printable board game.",
      ],
      built: [
        "Puzzle grammar, melodic pieces, validation, progression, and 80 levels.",
        "Browser game, drag interaction, synth, playback, and audio feedback.",
        "Composer Mode, missions, lessons, print kit, identity, and release.",
      ],
    },
    features: [
      { title: "Theory becomes touch", body: "Arpeggios, neighbors, approaches, and enclosures become pieces." },
      { title: "Hear every decision", body: "Tempo, swing, tone, drive, reverb, and tremolo make the grid sing." },
      { title: "From lessons to play", body: "The campaign opens into composing, missions, and print-at-home play." },
    ],
    media: [
      { type: "youtube", src: "uRz4HQILA_c", alt: "Bebop Puzzle project video", caption: "How Bebop Puzzle turns jazz into play." },
      { type: "image", src: "/media/projects/bebop-live.png", displaySrc: "/media/optimized/bebop-live.webp", alt: "Bebop Puzzle first level in play", caption: "Hear the line. Place the pieces. Make the changes connect.", width: 1800, height: 1125 },
    ],
  },
  {
    slug: "quicky-resume",
    title: "Quicky Resume",
    shortTitle: "Quicky",
    category: "Web App · Productivity",
    year: "2026",
    role: "Product, design & engineering",
    accent: "mint",
    externalUrl: "https://quickyresume.com",
    externalLabel: "Make a resume",
    tagline: "A good resume should not fight you.",
    description: "Edit the resume—not a form. Write on the page, move the photo, tune the layout, check the fit, and export privately in your browser.",
    note: "Multiple resumes. Autosave. Offline. Letter or A4. PDF, PNG, or JPG.",
    hero: { src: "/media/projects/quicky-live.png", displaySrc: "/media/optimized/quicky-live.webp", alt: "Quicky Resume direct editing canvas and style controls", width: 1800, height: 1125, position: "30% 22%", zoom: 1.3 },
    livePreview: { url: "https://quickyresume.com", label: "Edit a resume here", note: "Write, style, review, and export on the page itself." },
    features: [
      { title: "Edit the page itself", body: "Words, sections, photos, type, and spacing—all in one canvas." },
      { title: "Private by default", body: "Resume data and job comparisons never leave the browser." },
      { title: "Ready for the final mile", body: "One-page checks, ATS preview, backups, and clean exports." },
    ],
    media: [{ type: "image", src: "/media/projects/quicky-live.png", displaySrc: "/media/optimized/quicky-live.webp", alt: "Quicky Resume style editor and resume preview", caption: "A real resume. Five layouts. Direct editing.", width: 1800, height: 1125 }],
  },
  {
    slug: "5279-emulsion",
    title: "5279 Emulsion Project",
    shortTitle: "5279",
    category: "Research · Film Imaging",
    year: "2025—2026",
    role: "Research, imaging & software",
    accent: "amber",
    externalUrl: "https://lovejzzz.github.io/90sKid/",
    externalLabel: "Read the research",
    tagline: "Rebuilding a film stock from the silver up.",
    description: "Rebuild Kodak VISION 500T 5279 from Panasonic GH7 ProRes RAW through physical events—not a color preset. The pipeline models silver halide, dye clouds, the negative mask, 2383 print, and a period 2K scan.",
    note: "V29: 165 full frames at 5760×4320. 12-bit projection and scan masters. No creative grade in the baseline.",
    hero: { src: "/media/film/5279-projection-hi.jpg", displaySrc: "/media/optimized/5279-projection-hi.webp", alt: "A projected reference frame from the 5279 emulsion reconstruction", width: 2560, height: 1920, position: "50% 44%" },
    livePreview: { url: "https://lovejzzz.github.io/90sKid/", label: "Explore the research here", note: "Versions, evidence, methods, and full-size frame comparisons." },
    features: [
      { title: "Physical image model", body: "Emulsion, dye, grain, print, and scan are explicit stages." },
      { title: "Versioned evidence", body: "Every iteration preserves the proof, errors, and technical record." },
      { title: "Motion, not a hero frame", body: "The baseline holds across a complete shot—not one lucky still." },
    ],
    media: [
      { type: "video", src: "/media/film/5279-motion.mp4", alt: "5279 V29 motion validation", caption: "V29 in motion. Projection view.", chrome: false },
      { type: "image", src: "/media/projects/5279-live.png", displaySrc: "/media/optimized/5279-live.webp", alt: "5279 Emulsion Project live research site", caption: "V29 research and motion-validation baseline.", width: 1800, height: 1125, gallery: false },
      { type: "image", src: "/media/film/5279-projection-hi.jpg", displaySrc: "/media/optimized/5279-projection-hi.webp", alt: "5279 2383 projection result", caption: "2383 projection. 2560×1920 reference frame.", width: 2560, height: 1920, chrome: false },
      { type: "image", src: "/media/film/5279-scan-hi.jpg", displaySrc: "/media/optimized/5279-scan-hi.webp", alt: "5279 period scan result", caption: "Period 2K scan. 2560×1920 reference frame.", width: 2560, height: 1920, chrome: false },
    ],
  },
  {
    slug: "start-where-you-are",
    title: "Start Where You Are",
    shortTitle: "Start Here",
    category: "Short Film · NYU",
    year: "2025",
    role: "Filmmaking",
    accent: "red",
    externalUrl: "https://www.youtube.com/watch?v=i0xL_qslx8A",
    externalLabel: "Watch on YouTube",
    tagline: "Begin with what is already here.",
    description: "A short film about starting with what is already here: the place, the people, the feeling. Made at NYU through performance, rhythm, and practical production.",
    note: "Start before conditions are perfect.",
    hero: { src: "/media/projects/start-where-you-are-scope.jpg", displaySrc: "/media/optimized/start-where-you-are-scope.webp", alt: "Black-and-white still from Start Where You Are", width: 1280, height: 536, aspect: "2.39 / 1" },
    features: [
      { title: "Performance first", body: "Camera and edit serve presence—not spectacle." },
      { title: "Limits become language", body: "A small production turned constraint into style." },
      { title: "Finish the film", body: "Made, completed, released. The work starts there." },
    ],
    media: [{ type: "youtube", src: "i0xL_qslx8A", alt: "Start Where You Are short film", caption: "Watch the complete film.", chrome: false, poster: "/media/optimized/start-where-you-are-scope.webp" }],
  },
  {
    slug: "texas-jack",
    title: "Texas Jack",
    shortTitle: "Texas Jack",
    category: "Game · Cards",
    year: "2024",
    role: "Game design & engineering",
    accent: "green",
    externalUrl: "https://lovejzzz.github.io/TexasJack/",
    externalLabel: "Play Texas Jack",
    tagline: "Blackjack meets Texas Hold’em.",
    description: "Race to 21 on a shared board. Duel an adaptive dealer—or read three rivals around one pot.",
    note: "Every card changes more than one hand.",
    hero: { src: "/media/projects/texas-jack-duel-live.png", displaySrc: "/media/projects/texas-jack-duel-live.webp", alt: "Texas Jack Quick Duel with shared cards, Pressure, and Scout controls", width: 1800, height: 1125, position: "50% 58%" },
    livePreview: { url: "https://lovejzzz.github.io/TexasJack/", label: "Play Texas Jack here", note: "Choose Quick Duel or Four-Seat. Deal immediately." },
    features: [
      { title: "Quick Duel", body: "Share the board with an adaptive dealer. Press your read or Scout the next card." },
      { title: "Four-Seat", body: "Route cards to the Board or your Hand, then Lock before the table turns." },
      { title: "Pressure matters", body: "Raise, call, or fold against three readable rivals. Highest live total wins the pot." },
    ],
    media: [
      { type: "image", src: "/media/projects/texas-jack-duel-live.png", displaySrc: "/media/projects/texas-jack-duel-live.webp", alt: "Texas Jack Quick Duel in progress", caption: "Quick Duel. Shared cards feed both sides; Pressure wakes the Counter.", width: 1800, height: 1125 },
      { type: "image", src: "/media/projects/texas-jack-four-seat-live.png", displaySrc: "/media/projects/texas-jack-four-seat-live.webp", alt: "Texas Jack Four-Seat table with three AI rivals", caption: "Four seats. One shared board. Route the next card—or lock your total.", width: 1800, height: 1125 },
    ],
  },
  {
    slug: "slotronome",
    title: "Slotronome",
    shortTitle: "Slotronome",
    category: "Music Tool · Web Audio",
    year: "2025",
    role: "Product, interaction, sound & code",
    accent: "orange",
    externalUrl: "https://lovejzzz.github.io/Slotronome/",
    externalLabel: "Pull the lever",
    tagline: "A slot machine that deals you a tempo.",
    description: "Stop practicing at the same comfortable speed. Set a range, pull the lever, and Slotronome deals the tempo—then keeps time.",
    note: "Pixel cabinet. Brass trim. Reels. Motion. Machine sound. All HTML, CSS, and Web Audio.",
    hero: { src: "/media/projects/slotronome-live.png", displaySrc: "/media/optimized/slotronome-live.webp", alt: "Slotronome pixel cabinet running at 86 BPM", width: 1800, height: 1125, position: "50% 22%", zoom: 1.22 },
    livePreview: { url: "https://lovejzzz.github.io/Slotronome/", label: "Pull the lever here", note: "Deal a tempo. Press start. Change the accents." },
    features: [
      { title: "Practice by chance", body: "Random or stepped tempos break the comfort-speed habit." },
      { title: "A real metronome", body: "Meters, accents, precise adjustment, bar counts, and keyboard control." },
      { title: "Tactile without images", body: "The cabinet is gradients, shadows, type, motion, and synthesized sound." },
    ],
    media: [{ type: "image", src: "/media/projects/slotronome-live.png", displaySrc: "/media/optimized/slotronome-live.webp", alt: "Slotronome running at 86 BPM", caption: "86 BPM. First beat glowing.", width: 1800, height: 1125 }],
  },
  {
    slug: "here-we-go-film-studio",
    title: "Here We Go Film Studio",
    shortTitle: "Here We Go",
    category: "YouTube · Film Experiments",
    year: "Ongoing",
    role: "Direction, camera, edit & experiments",
    accent: "pink",
    externalUrl: "https://www.youtube.com/@HereWeGoFilmStudio",
    externalLabel: "Visit the channel",
    tagline: "The lab notebook is a movie channel.",
    description: "A public lab for filmmaking experiments. Lenses, light, motion, texture, edits, and unfinished questions leave the hard drive and become studies.",
    note: "Every experiment should teach the next shot.",
    hero: {
      src: "/media/projects/here-we-go-sunset-hero.jpg",
      displaySrc: "/media/optimized/here-we-go-sunset-hero.webp",
      alt: "For Rest: Sunset by Here We Go Film Studio",
      width: 2560,
      height: 1440,
      position: "50% 50%",
    },
    featuredFilm: {
      title: "Sunset",
      format: "For Rest · Short film",
      description: "Fifty seconds at the edge of day.",
      youtubeId: "XMCr7upIROA",
      url: "https://www.youtube.com/watch?v=XMCr7upIROA",
      poster: "/media/optimized/here-we-go-sunset-hero.webp",
    },
    features: [
      { title: "Camera as research", body: "Test exposure, movement, texture, and material by shooting." },
      { title: "Keep the process visible", body: "Questions and imperfections stay in the work." },
      { title: "Practice in public", body: "Technical curiosity becomes finished images and films." },
    ],
    media: [{
      type: "image",
      src: "/media/projects/here-we-go-sunset-hero.jpg",
      displaySrc: "/media/optimized/here-we-go-sunset-hero.webp",
      alt: "For Rest: Sunset by Here We Go Film Studio",
      caption: "For Rest: Sunset.",
      width: 2560,
      height: 1440,
    }, {
      type: "image",
      src: "/media/projects/channel-live.png",
      displaySrc: "/media/optimized/channel-live.webp",
      alt: "Here We Go Film Studio YouTube channel showing the For Rest film series",
      caption: "The channel. A public film lab.",
      width: 1800,
      height: 1125,
      chrome: false,
    }],
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
