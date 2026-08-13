# Weather Cinema

Production plan for the Weather app's cinematic room-and-window scenes.

## Scope

- 10 cities
- 4 weather states: sunny, rainy, snowy, foggy
- 2 lighting states: day, night
- 80 final 9:16 videos
- Seedance 2.5, 720x1280, 24 fps, 5 seconds

The ten-city catalog is a curated cinematic tier, not a limit on search.
Exact catalog matches use these hand-finished video plates. Any other city
returned by global search keeps using the procedural `WeatherCinemaEngine`,
so the app always has a living weather scene instead of an empty state.

The city catalog and prompt builders live in `catalog.mjs`.

## Production order

1. Generate one neutral master frame for a city.
2. Use the same master frame for all eight variants so the room, window,
   landmark, perspective, and furniture remain continuous.
3. Generate one video at a time. Higgsfield's Unlimited web mode does not
   reliably retain rapid concurrent submissions.
4. Download every result and run frame-contact-sheet QA before accepting it.
5. Regenerate failed variants before moving to the next city.

## Acceptance gates

- Landmark identity and scale remain stable across every frame.
- Window geometry, room architecture, and furniture do not morph.
- Weather has depth: near, middle, and distant layers must not read as a flat
  overlay.
- Exterior light must affect the room with coherent color, shadows, and
  reflections.
- No camera motion, people, text, logos, or newly invented objects.
- First and last frames should be close enough for a short crossfade loop.
- Automated QA requires 720x1280 at 24 fps for about five seconds, limits
  first-to-last luma drift to 18 and total sampled luma range to 35. It also
  requires at least 0.89 SSIM between the first and final usable frames, with
  a stricter 0.94 floor for fog so a dissolving fog bank cannot pass as a loop.

## Operator commands

- `npm run weather:progress` prints the complete 10-city production ledger.
- `npm run weather:next` prints the exact next missing city/state, master frame,
  and Seedance prompt. Add `-- --json` for machine-readable output.
- `npm run weather:localize` downloads accepted legacy CDN clips, validates
  dimensions, frame rate, frame count and duration, then switches the manifest
  to self-hosted assets. It is safe to rerun.
- `npm run weather:qa -- --city=<slug>` verifies one city's accepted clips.
- `npm run weather:ready` is the final release gate. It intentionally fails
  until all 10 selected masters and all 80 unique accepted videos exist and pass QA.

`masters.json` intentionally retains the original 30 master frames as a future
expansion library. Only cities in `catalog.mjs` belong to the current release.

## Pilot findings

- New York's full eight-scene pilot is accepted for composition, structural
  stability, weather legibility, and loop continuity.
- Los Angeles Sunny Night take 1 was rejected because it performed a visible
  day-to-night transition. Its 0.67 first/last SSIM validated the structural
  loop gate; accepted New York scenes measure 0.94-0.98.
- Hard looping is not reliable enough from the model alone. The site player
  should overlap two synchronized video layers with an approximately 350 ms
  crossfade at the loop boundary.
