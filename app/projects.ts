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
    repeatInGallery?: boolean;
  };
  leadMedia?: number[];
  featuredFilm?: {
    title: string;
    format: string;
    description: string;
    youtubeId: string;
    url: string;
  };
  livePreview?: { url: string; label: string; note: string };
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
    slug: "edutool",
    title: "EduTool.dev",
    shortTitle: "EduTool",
    category: "AI · Education",
    year: "2026",
    role: "Product, design & engineering",
    accent: "aqua",
    externalUrl: "https://edutool.dev",
    externalLabel: "Open EduTool.dev",
    tagline: "A course is a system. Build the whole thing.",
    description: "One course model. Ten connected deliverables. Course Mapper turns a syllabus into an editable system—then Scion checks the logic, evidence, and alignment.",
    note: "Built for instructors who need a course—not a wall of AI text.",
    hero: { src: "/media/projects/edutool-live.png", alt: "EduTool course generator with the brief, course settings, and generation workflow visible", width: 1800, height: 1125, position: "50% 12%" },
    livePreview: { url: "https://edutool.dev", label: "Build a course here", note: "Build, inspect, and edit a complete course in your browser." },
    caseStudy: {
      summary: "Generate broadly. Stay anchored to one brief.",
      problem: "AI can generate pages of course content and still fail to build a course. Objectives drift. Assessments disconnect. Evidence gets overstated.",
      exactRole: "Product strategy, UX, system architecture, AI workflows, front-end, and release.",
      collaboration: "Independent. Designed and built end to end.",
      decisions: [
        "One canonical model drives every deliverable.",
        "Deterministic compile, check, and repair passes follow generation.",
        "Local-first editing keeps evidence gaps and review status visible.",
      ],
      constraints: [
        "Early artifacts contradicted one another.",
        "Confident language outran the source material.",
        "Automation could never make the course opaque or hard to edit.",
      ],
      results: [
        "Live at edutool.dev.",
        "Scion V0.18.7 generates and revises 10 connected deliverables.",
        "One model now drives review, repair, editing, and export.",
      ],
      built: [
        "Course schema, generation pipeline, compiler, and cross-artifact checks.",
        "Scion agent, editors, quality report, evidence flow, and exports.",
        "UX writing, interaction system, visual design, and release.",
      ],
    },
    model: {
      eyebrow: "THE COURSE INTELLIGENCE LAYER",
      title: "Meet Scion",
      version: "V0.18.7",
      description: "Scion generates, checks, and repairs the course as one connected system—always anchored to the brief and evidence.",
      principles: [
        { title: "Brief-anchored", body: "The original intent stays active through every generation and revision." },
        { title: "System-aware", body: "Every artifact is reasoned about as part of the same course." },
        { title: "Evidence-honest", body: "Source gaps and review needs stay visible." },
        { title: "Human-editable", body: "Inspect one item. Repair the system. Edit everything." },
      ],
    },
    features: [
      { title: "10 aligned deliverables", body: "One model keeps objectives, lessons, assessments, and exports in sync." },
      { title: "Course-aware agent", body: "Inspect, explain, and revise the whole workspace in conversation." },
      { title: "Local-first Scion", body: "Private browser authoring with evidence-led compilation." },
    ],
    media: [{ type: "image", src: "/media/projects/edutool-generation.png", alt: "EduTool generation workspace showing Scion, the quiz bank, quality report, and export status", caption: "Scion refining one connected course with evidence and review status in view.", width: 1275, height: 717 }],
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
    tagline: "Push. Recover. Come back stronger.",
    description: "Turn one target into a training wave. Surge alternates harder push sets with active recovery so every session builds, peaks, and finishes clear.",
    note: "No account. No internet. No data collection. History stays on-device.",
    hero: { src: "/media/surge/main-hi.png", displaySrc: "/media/optimized/main-hi.webp", alt: "Surge Method setup screen showing a progressive training wave", width: 1197, height: 2600, fit: "contain", repeatInGallery: true },
    caseStudy: {
      summary: "Make progression obvious while the user is moving.",
      problem: "Most workout timers prescribe or count. Surge had to turn one personal target into a progressive session anyone could follow mid-set.",
      exactRole: "Concept, training system, UX, visual design, iOS, testing, and release.",
      collaboration: "Independent. Designed, built, and shipped solo.",
      decisions: [
        "Build sessions as push-and-recovery waves—not flat ladders.",
        "Use one planning system for reps and time.",
        "Make motion, sound, and haptics carry workout state.",
      ],
      constraints: [
        "One planner had to fit radically different activities.",
        "The interface had to read at a glance under exertion.",
        "Offline privacy ruled out accounts and cloud planning.",
      ],
      results: [
        "Released on the Apple App Store.",
        "Ships rep and timed modes, wave planning, guided sessions, and private history.",
        "Runs without accounts, internet, or personal-data collection.",
      ],
      built: [
        "Wave planner, rep and timed engines, setup, and live sessions.",
        "Local history, progress views, haptics, sound, and completion flow.",
        "The full iOS product, store assets, testing, and release.",
      ],
    },
    features: [
      { title: "Two training modes", body: "Rep waves for strength. Timed waves for endurance, skill, or focus." },
      { title: "Smart wave planning", body: "Set one target. Get the warmup, recovery, climb, and peak." },
      { title: "Built to feel alive", body: "Haptics, motion, sound, progress, and a boss-set finish." },
    ],
    media: [
      { type: "image", src: "/media/surge/main-hi.png", displaySrc: "/media/optimized/main-hi.webp", alt: "Surge Method setup screen", caption: "Set the target. See the wave.", portrait: true, width: 1197, height: 2600 },
      { type: "image", src: "/media/surge/push-hi.png", displaySrc: "/media/optimized/push-hi.webp", alt: "Surge Method push set", caption: "Push toward the peak.", portrait: true, width: 1197, height: 2600 },
      { type: "image", src: "/media/surge/recovery-hi.png", displaySrc: "/media/optimized/recovery-hi.webp", alt: "Surge Method recovery set", caption: "Recover without stopping.", portrait: true, width: 1197, height: 2600 },
      { type: "image", src: "/media/surge/complete-hi.png", displaySrc: "/media/optimized/complete-hi.webp", alt: "Surge Method workout complete screen", caption: "Finish with a clear record.", portrait: true, width: 1197, height: 2600 },
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
    hero: { src: "/media/projects/bebop-live.png", alt: "Bebop Puzzle chord grid with melodic pieces ready to connect", width: 1800, height: 1125 },
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
      { type: "image", src: "/media/projects/bebop-live.png", alt: "Bebop Puzzle first level in play", caption: "Hear the line. Place the pieces. Make the changes connect.", width: 1800, height: 1125 },
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
    hero: { src: "/media/projects/quicky-live.png", alt: "Quicky Resume direct editing canvas and style controls", width: 1800, height: 1125, position: "50% 18%" },
    livePreview: { url: "https://quickyresume.com", label: "Edit a resume here", note: "Write, style, review, and export on the page itself." },
    features: [
      { title: "Edit the page itself", body: "Words, sections, photos, type, and spacing—all in one canvas." },
      { title: "Private by default", body: "Resume data and job comparisons never leave the browser." },
      { title: "Ready for the final mile", body: "One-page checks, ATS preview, backups, and clean exports." },
    ],
    media: [{ type: "image", src: "/media/projects/quicky-live.png", alt: "Quicky Resume style editor and resume preview", caption: "A real resume. Five layouts. Direct editing.", width: 1800, height: 1125 }],
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
      { type: "image", src: "/media/projects/5279-live.png", alt: "5279 Emulsion Project live research site", caption: "V29 research and motion-validation baseline.", width: 1800, height: 1125, gallery: false },
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
    hero: { src: "/media/projects/start-where-you-are.jpg", alt: "Black-and-white still from Start Where You Are", width: 1280, height: 720, position: "50% 42%" },
    features: [
      { title: "Performance first", body: "Camera and edit serve presence—not spectacle." },
      { title: "Limits become language", body: "A small production turned constraint into style." },
      { title: "Finish the film", body: "Made, completed, released. The work starts there." },
    ],
    media: [{ type: "youtube", src: "i0xL_qslx8A", alt: "Start Where You Are short film", caption: "Watch the complete film.", chrome: false }],
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
    description: "Blackjack urgency. Hold’em structure. Texas Jack collides two familiar card systems in one fast browser game.",
    note: "Learn it in one hand. Want another by the next.",
    hero: { src: "/media/projects/texas-jack-live.png", alt: "Texas Jack browser game in the middle of a hand", width: 1800, height: 1125, position: "50% 58%" },
    livePreview: { url: "https://lovejzzz.github.io/TexasJack/", label: "Deal a hand here", note: "Set the bet. Deal the cards. Play now." },
    features: [
      { title: "Two games. One table.", body: "Hole cards and community cards race toward twenty-one." },
      { title: "Learn by playing", body: "Familiar rules make the hybrid click without a manual." },
      { title: "Instant deal", body: "No download. No account. Just play." },
    ],
    media: [{ type: "image", src: "/media/projects/texas-jack-live.png", alt: "Texas Jack in the middle of a hand", caption: "One hidden card. One shared queen. Nineteen for the player.", width: 1800, height: 1125 }],
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
    hero: { src: "/media/projects/slotronome-live.png", alt: "Slotronome pixel cabinet running at 86 BPM", width: 1800, height: 1125, position: "50% 40%" },
    livePreview: { url: "https://lovejzzz.github.io/Slotronome/", label: "Pull the lever here", note: "Deal a tempo. Press start. Change the accents." },
    features: [
      { title: "Practice by chance", body: "Random or stepped tempos break the comfort-speed habit." },
      { title: "A real metronome", body: "Meters, accents, precise adjustment, bar counts, and keyboard control." },
      { title: "Tactile without images", body: "The cabinet is gradients, shadows, type, motion, and synthesized sound." },
    ],
    media: [{ type: "image", src: "/media/projects/slotronome-live.png", alt: "Slotronome running at 86 BPM", caption: "86 BPM. First beat glowing.", width: 1800, height: 1125 }],
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
    },
    features: [
      { title: "Camera as research", body: "Test exposure, movement, texture, and material by shooting." },
      { title: "Keep the process visible", body: "Questions and imperfections stay in the work." },
      { title: "Practice in public", body: "Technical curiosity becomes finished images and films." },
    ],
    media: [{
      type: "image",
      src: "/media/projects/here-we-go-sunset-hero.jpg",
      alt: "For Rest: Sunset by Here We Go Film Studio",
      caption: "For Rest: Sunset.",
      width: 2560,
      height: 1440,
    }, {
      type: "image",
      src: "/media/projects/channel-live.png",
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
