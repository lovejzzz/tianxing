export const WEATHER_STATES = [
  ["sunny", "day"],
  ["sunny", "night"],
  ["rainy", "day"],
  ["rainy", "night"],
  ["snowy", "day"],
  ["snowy", "night"],
  ["foggy", "day"],
  ["foggy", "night"],
];

// Ten instantly recognizable cities with deliberately different interiors.
// Each row is: slug, city, country, hero landmark, room design language.
export const CITIES = [
  ["new-york", "New York", "United States", "Empire State Building", "a 1930s Manhattan Art Deco study in walnut, brass, oxblood leather and cream stone"],
  ["los-angeles", "Los Angeles", "United States", "Griffith Observatory", "a warm Hollywood Hills modernist living room with walnut, travertine and vintage cinema objects"],
  ["san-francisco", "San Francisco", "United States", "Golden Gate Bridge", "a Pacific Heights bay-window salon with redwood, fog-softened glass and collected ceramics"],
  ["chicago", "Chicago", "United States", "Willis Tower", "a Miesian lakefront apartment with black steel, leather and disciplined modernist furniture"],
  ["toronto", "Toronto", "Canada", "CN Tower", "a sophisticated lakeside apartment with Canadian oak, wool, blackened steel and graphic art"],
  ["mexico-city", "Mexico City", "Mexico", "Palacio de Bellas Artes", "a refined Mexican modernist room with volcanic stone, warm timber, woven textiles and bold art"],
  ["rio-de-janeiro", "Rio de Janeiro", "Brazil", "Christ the Redeemer", "a curved tropical modern room with mosaic stone, rosewood and breezy white curtains"],
  ["london", "London", "United Kingdom", "Elizabeth Tower", "a moody Mayfair library with dark oak, green leather, brass and tailored wool"],
  ["paris", "Paris", "France", "Eiffel Tower", "a Haussmann apartment with herringbone floors, carved plaster, antique mirrors and quiet modern furniture"],
  ["rome", "Rome", "Italy", "Colosseum", "a cinematic Roman palazzo room with travertine, walnut, linen and archaeological fragments"],
];

export const cityCount = CITIES.length;
export const videoCount = cityCount * WEATHER_STATES.length;

export function masterFramePrompt([, city, country, landmark, room]) {
  return `Vertical 9:16 cinematic photoreal master frame for ${city}, ${country}. Locked camera inside ${room}, looking through one broad, architecturally believable window at ${landmark} and a recognizable local skyline. Neutral late-afternoon overcast base lighting suitable for later relighting into sun, rain, snow, fog, day and night. Physically coherent interior and exterior perspective and scale, authentic window frame and glass thickness, layered atmospheric depth, premium feature-film production design, subtle 35mm texture, rich blacks without crushed detail, empty room, no people, no text, no logos, no watermark.`;
}

const WEATHER_DIRECTION = {
  sunny: "a fully clear atmosphere with only restrained slow high-cloud movement; visibility, cloud cover and atmospheric clarity remain constant from first frame through last",
  rainy: "unmistakably visible cinematic rain: dense wind-shaped sheets crossing the skyline at a shallow diagonal, many irregular medium-depth streaks beyond the window, sharp beads merging into several slow gravity-driven rivulets on the exterior glass, soft distant precipitation haze, and clearly wet roofs and streets carrying restrained moving reflections; the rain must read immediately in every frame, not merely as gray fog or clouds; motion is fluid at 24 fps with varied speed, length and spacing, never uniform, frozen or stuttering",
  snowy: "clearly visible varied snow at three depths: tiny slow distant flakes, irregular mid-depth flakes and sparse soft near-window flakes; believable accumulation on exterior ledges and roofs; cold atmospheric scattering outside and quiet warm bounced light inside; flakes never move as one flat overlay",
  foggy: "unmistakable mature volumetric fog with strong but believable depth falloff: nearby architecture retains detail, middle-distance buildings dissolve in layers and the hero landmark is visibly softened but still recognizable; subtle condensation and bloom on the exterior glass; fog density, opacity and visibility distance remain constant from first frame through last frame and never lift, clear, thin, thicken, roll away or reveal more skyline; never a merely clear or cloudy scene",
};

const LIGHT_DIRECTION = {
  day: "natural daytime exposure with stable sculpted sunlight; warm directional exterior light must enter the room and create physically correct window-frame shadows, bounced color and restrained specular response",
  night: "unmistakably after-midnight cinematic exposure with a deep black-blue sky, illuminated city and landmark practical lights, and a low-key interior shaped by cool exterior light plus restrained warm lamps; it must never resemble day, overcast daylight, dusk, sunrise or sunset",
};

export function videoPrompt(city, weather, light) {
  const [, name, country, landmark] = city;
  return `${name}, ${country} — ${weather.toUpperCase()} ${light.toUpperCase()}. Preserve the reference image's exact locked camera, room architecture, furniture placement, window geometry, ${landmark} identity, skyline layout, perspective and composition. Create ${WEATHER_DIRECTION[weather]}; ${LIGHT_DIRECTION[light]}. The entire clip is already fully ${light} and ${weather} in its first frame and remains in that exact lighting and weather state through the last frame: absolutely no time-lapse, sunrise, sunset, day-to-night or night-to-day transition, weather transition, exposure ramp, or lights switching on or off. The landmark remains stable, recognizable and correctly scaled. Only natural environmental micro-motion. No camera movement, no zoom, no object morphing, no new furniture, no people, no text, no logos. Premium feature-film cinematography, photoreal, rich highlight rolloff, subtle 35mm texture. Build the motion as an ambient loop: the final frame must visually align with the first.`;
}
