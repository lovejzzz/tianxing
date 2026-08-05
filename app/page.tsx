import { PhoneExperience } from "./components/PhoneExperience";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="home-intro" aria-labelledby="portfolio-title">
        <p className="edition-label">Portfolio · Edition 01</p>
        <h1 id="portfolio-title">
          Tian Xing<span>delivers.</span>
        </h1>
        <p className="intro-copy">Welcome to my heart. Have fun.</p>
        <div className="intro-rule">
          <span>Selected work</span>
          <span>2024—2026</span>
        </div>
      </section>

      <PhoneExperience />

      <footer className="home-footer">
        <span>New York</span>
        <span>Designed &amp; built by Tian Xing</span>
      </footer>
    </main>
  );
}
