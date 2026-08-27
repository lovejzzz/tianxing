import { AboutExperience } from "../components/AboutExperience";

export const metadata = {
  title: "About",
  description: "Tian Xing is a New York visual artist, filmmaker, and builder working across products, games, films, and creative tools.",
  alternates: { canonical: "https://tian.fun/about/" },
};

export default function AboutPage() {
  return <AboutExperience />;
}
