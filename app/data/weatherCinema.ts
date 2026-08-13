import masterManifest from "../../production/weather-cinema/masters.json";
import videoManifest from "../../production/weather-cinema/videos.json";

export type WeatherCinemaKind = "sunny" | "rainy" | "snowy" | "foggy";
export type WeatherCinemaLight = "day" | "night";

export type WeatherCinemaCity = {
  slug: string;
  name: string;
  country: string;
  admin?: string;
  latitude: number;
  longitude: number;
  glow: string;
  aliases?: string[];
};

export const WEATHER_CINEMA_CITIES: WeatherCinemaCity[] = [
  { slug: "new-york", name: "New York", country: "United States", admin: "New York", latitude: 40.7128, longitude: -74.006, glow: "rgba(218,157,73,.30)", aliases: ["New York City", "NYC"] },
  { slug: "los-angeles", name: "Los Angeles", country: "United States", admin: "California", latitude: 34.0522, longitude: -118.2437, glow: "rgba(227,151,91,.30)", aliases: ["LA"] },
  { slug: "san-francisco", name: "San Francisco", country: "United States", admin: "California", latitude: 37.7749, longitude: -122.4194, glow: "rgba(118,168,176,.28)", aliases: ["SF"] },
  { slug: "chicago", name: "Chicago", country: "United States", admin: "Illinois", latitude: 41.8781, longitude: -87.6298, glow: "rgba(112,151,182,.28)" },
  { slug: "toronto", name: "Toronto", country: "Canada", admin: "Ontario", latitude: 43.6532, longitude: -79.3832, glow: "rgba(107,169,192,.28)" },
  { slug: "mexico-city", name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, glow: "rgba(205,121,84,.30)", aliases: ["Ciudad de México", "CDMX"] },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", country: "Brazil", latitude: -22.9068, longitude: -43.1729, glow: "rgba(72,173,144,.29)", aliases: ["Rio"] },
  { slug: "london", name: "London", country: "United Kingdom", admin: "England", latitude: 51.5072, longitude: -0.1276, glow: "rgba(121,151,177,.30)" },
  { slug: "paris", name: "Paris", country: "France", admin: "Île-de-France", latitude: 48.8566, longitude: 2.3522, glow: "rgba(204,119,111,.28)" },
  { slug: "rome", name: "Rome", country: "Italy", admin: "Lazio", latitude: 41.9028, longitude: 12.4964, glow: "rgba(204,143,85,.30)", aliases: ["Roma"] },
];

type MasterManifestItem = { slug: string; city: string; id: string; url: string };
type VideoManifestItem = { city: string; weather: WeatherCinemaKind; light: WeatherCinemaLight; id: string; url: string; qa: string };

const masters = (masterManifest.items as MasterManifestItem[]).reduce<Record<string, MasterManifestItem>>((map, item) => {
  map[item.slug] = item;
  return map;
}, {});

const videos = (videoManifest.items as VideoManifestItem[]).reduce<Record<string, VideoManifestItem>>((map, item) => {
  if (item.qa === "accepted") map[`${item.city}:${item.weather}:${item.light}`] = item;
  return map;
}, {});

const normalizeCityName = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function findWeatherCinemaCity(name: string, country?: string) {
  const normalized = normalizeCityName(name);
  const normalizedCountry = normalizeCityName(country ?? "");
  return WEATHER_CINEMA_CITIES.find((city) => {
    const names = [city.name, ...(city.aliases ?? [])].map(normalizeCityName);
    return names.includes(normalized) && (!normalizedCountry || normalizeCityName(city.country) === normalizedCountry);
  }) ?? WEATHER_CINEMA_CITIES.find((city) => [city.name, ...(city.aliases ?? [])].map(normalizeCityName).includes(normalized));
}

export function weatherCinemaKind(code: number): WeatherCinemaKind {
  if (code === 45 || code === 48) return "foggy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rainy";
  return "sunny";
}

export function weatherCinemaAsset(cityName: string, country: string | undefined, code: number, isDay: boolean) {
  const city = findWeatherCinemaCity(cityName, country);
  if (!city) return null;
  const weather = weatherCinemaKind(code);
  const light: WeatherCinemaLight = isDay ? "day" : "night";
  return {
    city,
    weather,
    light,
    poster: masters[city.slug]?.url,
    video: videos[`${city.slug}:${weather}:${light}`]?.url,
  };
}
