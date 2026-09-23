import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-sign">
        <strong>Tian Xing</strong>
        <span>Visual artist, filmmaker, and builder in New York.</span>
      </div>
      <nav className="site-footer-links" aria-label="Contact">
        <a href="mailto:xingpicture@gmail.com?subject=Hello%20Tian">xingpicture@gmail.com</a>
        <a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer">GitHub ↗</a>
        <Link href="/">Back to the iPhone</Link>
      </nav>
    </footer>
  );
}
