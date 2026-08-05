import { PhoneExperience } from "./components/PhoneExperience";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <p className="heart-note">Welcome to my heart. Have fun. <span>— Tian Xing</span></p>
      <PhoneExperience />
    </main>
  );
}
