import { PhoneExperience } from "./components/PhoneExperience";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <PhoneExperience />
    </main>
  );
}
