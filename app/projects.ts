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
  features: { title: string; body: string }[];
  media: { type: "image" | "video" | "youtube"; src: string; alt: string; caption?: string; portrait?: boolean }[];
};

export const projects: Project[] = [
  {
    slug: "edutool",
    title: "EduTool.dev",
    shortTitle: "EduTool",
    category: "AI · Education",
    year: "2024—2026",
    role: "Product, design & engineering",
    accent: "aqua",
    externalUrl: "https://edutool.dev",
    externalLabel: "Open EduTool.dev",
    tagline: "A course is a system. Build the whole thing.",
    description: "Course Mapper turns a syllabus into an editable instructional system: course maps, lesson plans, slide decks, rubrics, quizzes, assignments, discussions, study guides, and a polished syllabus. Its current Scion path combines local-first authoring with a deterministic course compiler and explicit evidence boundaries.",
    note: "Built for instructors who need structured artifacts—not another wall of chatbot prose.",
    features: [
      { title: "10 aligned deliverables", body: "A single course model keeps objectives, lessons, assessments, and exports connected." },
      { title: "Course-aware agent", body: "Inspect, explain, and revise the generated workspace through natural conversation." },
      { title: "Local-first Scion", body: "A free browser-local authoring path with privacy boundaries and evidence-led compilation." },
    ],
    media: [{ type: "image", src: "/media/projects/edutool.png", alt: "Course Mapper generation workspace", caption: "The Course Mapper workspace: one course, ten coordinated material families." }],
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
    description: "Surge Method is an active-recovery training system for anything with repetitions. It alternates increasingly demanding push sets with lower-intensity recovery sets, turning a target into a clear workout wave you can follow, feel, and finish.",
    note: "No account, no internet, no collected data—training history stays on the device.",
    features: [
      { title: "Two training modes", body: "Rep-based waves for strength and timed waves for endurance, skills, or focus practice." },
      { title: "Smart wave planning", body: "A complete set pattern is generated from the target, with warmup, recovery, and peak phases." },
      { title: "Built to feel alive", body: "Haptics, responsive motion, sound, progress graphs, and a celebratory boss-set finish." },
    ],
    media: [
      { type: "image", src: "/media/surge/main.webp", alt: "Surge Method setup screen", caption: "Choose a target and see the whole training wave.", portrait: true },
      { type: "image", src: "/media/surge/push.webp", alt: "Surge Method push set", caption: "Push phases climb toward a deliberate peak.", portrait: true },
      { type: "image", src: "/media/surge/recovery.webp", alt: "Surge Method recovery set", caption: "Recovery stays active instead of becoming dead time.", portrait: true },
      { type: "image", src: "/media/surge/complete.webp", alt: "Surge Method workout complete screen", caption: "Every session ends with a clear performance record.", portrait: true },
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
    description: "Bebop Puzzle teaches jazz vocabulary as a tactile connection game. Drag four-note melodic pieces onto a chord grid, line up their entry and exit points, and hear the complete bebop phrase come alive through a Rhodes-inspired instrument.",
    note: "Six chapters, 80 levels, daily missions, a printable boardgame kit, and a freeform Composer Mode.",
    features: [
      { title: "Theory becomes touch", body: "Arpeggios, neighbors, approaches, and enclosures behave like pieces you can connect." },
      { title: "Hear every decision", body: "Playback, tempo, swing, tone, drive, reverb, and tremolo make the grid musical." },
      { title: "From lessons to play", body: "A guided campaign gradually opens into composition, daily missions, and print-at-home play." },
    ],
    media: [{ type: "image", src: "/media/projects/bebop.png", alt: "Bebop Puzzle chapter screen", caption: "A warm, late-night interface for learning bebop one phrase at a time." }],
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
    description: "Quicky Resume is a private, browser-based resume studio with direct editing, research-backed layouts, one-page fit guidance, job-posting term checks, and clean exports. It keeps the document tangible: click the page, edit the words, move the photo, and see the result immediately.",
    note: "Multiple tailored resumes, autosave and recovery, offline use, US Letter or A4, and PDF, PNG, or JPG export.",
    features: [
      { title: "Edit the page itself", body: "Inline content, fluid sections, photo placement, typography, and spacing in one direct canvas." },
      { title: "Private by default", body: "Resume data and job-posting comparisons stay in the browser—no account required." },
      { title: "Built for the final mile", body: "One-page checks, ATS-readable preview, backups, exports, and a focused final review." },
    ],
    media: [{ type: "image", src: "/media/projects/quicky.jpg", alt: "Quicky Resume editor", caption: "Editorial-glass controls around a document that remains the center of attention." }],
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
    description: "An evidence-led reconstruction of Kodak VISION 500T 5279 image formation from Panasonic GH7 ProRes RAW. The model follows finite silver-halide events, dye clouds, speed layers, interimage effects, the colored negative mask, Kodak 2383 print formation, and a period 2K scan.",
    note: "V29 validates 165 complete frames at 5760×4320 with 12-bit projection and scan masters while keeping artistic grading outside the baseline.",
    features: [
      { title: "Physical image model", body: "Emulsion events, dye formation, grain statistics, optical printing, and scan behavior are explicit stages." },
      { title: "Versioned evidence", body: "Every iteration preserves comparisons, research, errors, and bilingual technical notes." },
      { title: "Motion, not a hero frame", body: "The current baseline is validated across a complete shot with stable frame-to-frame behavior." },
    ],
    media: [
      { type: "video", src: "/media/film/5279-motion.mp4", alt: "5279 V29 motion validation", caption: "V29 projection-view motion validation." },
      { type: "image", src: "/media/projects/5279.png", alt: "5279 emulsion project V29 overview", caption: "The V29 baseline and its complete image-formation chain." },
      { type: "image", src: "/media/film/5279-projection.jpg", alt: "5279 2383 projection result", caption: "2383 projection viewing chain." },
      { type: "image", src: "/media/film/5279-scan.jpg", alt: "5279 period scan result", caption: "Period 2K scan viewing chain." },
    ],
  },
  {
    slug: "start-where-you-are",
    title: "Start Where You Are",
    shortTitle: "Start Here",
    category: "Short Film · NYU",
    year: "2019",
    role: "Filmmaking",
    accent: "red",
    externalUrl: "https://www.youtube.com/watch?v=i0xL_qslx8A",
    externalLabel: "Watch on YouTube",
    tagline: "A film project made at NYU.",
    description: "Start Where You Are is a narrative film project from my time at NYU—a compact piece about beginning from the place, people, and emotional material already around you. It sits at the meeting point of performance, visual rhythm, and practical filmmaking.",
    note: "The title remains a useful creative principle: do not wait for perfect conditions to begin.",
    features: [
      { title: "Performance first", body: "The camera and edit are organized around human presence rather than spectacle." },
      { title: "Economy of means", body: "A small production treated limitation as part of the visual language." },
      { title: "A complete object", body: "An early film finished, released, and still connected to the work that followed." },
    ],
    media: [{ type: "youtube", src: "i0xL_qslx8A", alt: "Start Where You Are short film", caption: "Watch the complete film." }],
  },
  {
    slug: "texas-jack",
    title: "Texas Jack",
    shortTitle: "Texas Jack",
    category: "Game · Cards",
    year: "2017",
    role: "Game design & engineering",
    accent: "green",
    externalUrl: "https://lovejzzz.github.io/TexasJack/",
    externalLabel: "Play Texas Jack",
    tagline: "Blackjack meets Texas Hold’em.",
    description: "Texas Jack combines the instant arithmetic tension of Blackjack with the shared-card structure of Texas Hold’em. It is a small browser game built around a single idea: familiar rules can become surprising when their systems collide.",
    note: "An early web-game experiment—direct, playable, and just strange enough to invite one more hand.",
    features: [
      { title: "Two rule sets, one table", body: "Hole cards and community cards meet the race toward twenty-one." },
      { title: "Fast to understand", body: "Familiar card language makes the hybrid playable without a manual." },
      { title: "Made for the browser", body: "No download or account; sit down and play a hand." },
    ],
    media: [{ type: "image", src: "/media/projects/texas-jack.png", alt: "Texas Jack card game", caption: "A focused table for a hybrid card game." }],
  },
  {
    slug: "slotronome",
    title: "Slotronome",
    shortTitle: "Slotronome",
    category: "Music Tool · Web Audio",
    year: "2026",
    role: "Product, interaction, sound & code",
    accent: "orange",
    externalUrl: "https://lovejzzz.github.io/Slotronome/",
    externalLabel: "Pull the lever",
    tagline: "A slot machine that deals you a tempo.",
    description: "Slotronome is a pixel-art metronome designed to break the habit of practicing only at a comfortable speed. Set a range, pull the lever, and it deals a new tempo—then keeps time with accents, changing meters, and optional automatic re-deals.",
    note: "The oak cabinet, brass trim, amber reels, scanlines, glare, motion, and synthesized machine sounds are built from HTML, CSS, and Web Audio.",
    features: [
      { title: "Practice by chance", body: "Random or incremental tempo changes keep technique flexible across a chosen range." },
      { title: "A real metronome underneath", body: "Meters, beat accents, digit-level adjustment, bar counting, and keyboard control." },
      { title: "Tactile without images", body: "A complete pixel cabinet made from gradients, shadows, type, motion, and synthesized sound." },
    ],
    media: [{ type: "image", src: "/media/projects/slotronome.png", alt: "Slotronome pixel art metronome", caption: "The amber CRT, brass controls, and lever turn practice into a tiny ritual." }],
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
    description: "Here We Go Film Studio is where filmmaking experiments leave the hard drive. Tests, observations, process, and finished fragments become public studies in lenses, light, motion, texture, editing, and whatever else the next project needs to understand.",
    note: "Not every experiment needs to become a feature. It does need to teach the next shot something.",
    features: [
      { title: "Camera as research", body: "The image is tested through doing—exposure, movement, texture, and material behavior." },
      { title: "Process stays visible", body: "Experiments retain the questions and imperfections that made them useful." },
      { title: "A continuing practice", body: "The channel connects technical curiosity with the desire to make complete films." },
    ],
    media: [{ type: "image", src: "/media/projects/channel.jpg", alt: "Here We Go Film Studio channel artwork", caption: "Ongoing filmmaking experiments from Here We Go Film Studio." }],
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
