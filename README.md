# Tian Xing — Selected Work

A personal portfolio for nine projects across software, games, cinema, music tools, and research. The visual system borrows the tactile glass, metal, and candy-colored icon language of the iPhone 4 era.

## Projects

- EduTool.dev / Course Mapper
- Surge Method
- Bebop Puzzle
- Quicky Resume
- 5279 Emulsion Project
- Start Where You Are
- Texas Jack
- Slotronome
- Here We Go Film Studio

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

`npm run build` validates the Sites build. `npm run build:pages` creates the static GitHub Pages site in `out/`.

## Weather cinema

The Weather app uses a hybrid renderer. Ten curated cities have eight cinematic day/night weather films each. Any other city found through search—and any curated film that is still missing or fails to load—falls back automatically to the procedural weather engine, so global search always remains usable without a blank or placeholder state.

## Deployment

Pushing `main` runs the GitHub Pages workflow. The public site is available at [tian.fun](https://tian.fun/).
