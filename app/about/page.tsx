import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-device">
        <div className="about-screen">
          <div className="about-status"><span>●●●●○</span><span>9:41 AM</span><span>100% ▰</span></div>
          <div className="about-nav"><Link href="/">‹ Projects</Link><strong>About</strong><span /></div>
          <section>
            <div className="coming-icon"><i>TX</i></div>
            <p>PROFILE UPDATE</p>
            <h1>Coming Soon</h1>
            <span>The story is still being written.</span>
            <Link href="/">Return to Selected Work</Link>
          </section>
        </div>
        <div className="home-button" aria-hidden="true"><span /></div>
      </div>
    </main>
  );
}
