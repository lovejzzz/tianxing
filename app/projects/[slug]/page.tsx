import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "../../components/AppIcon";
import { getProject, projects } from "../../projects";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const pageUrl = `https://tian.fun/projects/${project.slug}/`;
  const imageUrl = new URL(project.hero.src, "https://tian.fun").toString();
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${project.title} — Tian Xing`,
      description: project.tagline,
      type: "website",
      url: pageUrl,
      images: [{ url: imageUrl, width: project.hero.width, height: project.hero.height, alt: project.hero.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — Tian Xing`,
      description: project.tagline,
      images: [imageUrl],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const index = projects.findIndex((item) => item.slug === project.slug);
  const next = projects[(index + 1) % projects.length];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const leadMediaIndexes = new Set(project.leadMedia ?? []);
  const leadMedia = project.media.filter((_, mediaIndex) => leadMediaIndexes.has(mediaIndex));
  const galleryMedia = project.media.filter((item, mediaIndex) => (
    item.gallery !== false
    && !leadMediaIndexes.has(mediaIndex)
    && (project.hero.repeatInGallery || item.src !== project.hero.src)
  ));

  const renderMediaGallery = (media: typeof project.media) => media.length > 0 && (
    <section className={`media-gallery ${media.some((item) => item.portrait) ? "portrait-gallery" : ""}`} aria-label={`${project.title} screenshots`}>
      {media.map((item) => {
        const mediaIndex = project.media.indexOf(item);
        return (
          <figure
            className={`media-item media-${item.type}`}
            key={`${item.src}-${mediaIndex}`}
            style={{ "--media-max": item.width ? `${item.width}px` : "1600px" } as CSSProperties}
          >
            <div className="media-frame">
              {item.type === "image" && item.chrome !== false && !item.portrait && (
                <div className="media-chrome" aria-hidden="true"><i /><i /><i /><span>{project.title}</span></div>
              )}
              {item.type === "image" && (
                <a className="media-image-link" href={`${base}${item.src}`} target="_blank" rel="noreferrer" aria-label={`View full resolution: ${item.alt}`}>
                  {/* Raw screenshots keep their native aspect ratios and never render wider than their source pixels. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${base}${item.displaySrc ?? item.src}`} alt={item.alt} width={item.width} height={item.height} loading={mediaIndex ? "lazy" : "eager"} decoding="async" />
                  <span>FULL RESOLUTION ↗</span>
                </a>
              )}
              {item.type === "video" && <video src={`${base}${item.src}`} aria-label={item.alt} controls muted loop playsInline preload="metadata" poster={item.poster ? `${base}${item.poster}` : undefined} />}
              {item.type === "youtube" && (
                <iframe src={`https://www.youtube-nocookie.com/embed/${item.src}?rel=0`} title={item.alt} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              )}
            </div>
            {item.caption && <figcaption><span>{String(mediaIndex + 1).padStart(2, "0")}</span>{item.caption}</figcaption>}
          </figure>
        );
      })}
    </section>
  );

  return (
    <main className={`detail-page accent-${project.accent}`}>
      <a className="skip-link" href="#project-content">Skip to project content</a>
      <header className="detail-nav">
        <Link className="back-button" href="/" aria-label="Back to all projects"><span>‹</span> Projects</Link>
        <Link className="wordmark" href="/">TIAN XING <small>/ SELECTED WORK</small></Link>
        <Link className="about-button" href="/about">About</Link>
      </header>

      <article id="project-content">
        <section className="project-hero">
          <div className="project-identity">
            <div>
              <p className="project-category">{project.category}</p>
              <h1>{project.title}</h1>
              <p className="project-tagline">{project.tagline}</p>
            </div>
          </div>
          <figure
            className={`project-hero-visual ${project.hero.fit === "contain" ? "project-hero-contain" : ""}`}
            style={{ "--hero-position": project.hero.position ?? "50% 50%" } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}${project.hero.displaySrc ?? project.hero.src}`} alt={project.hero.alt} width={project.hero.width} height={project.hero.height} fetchPriority="high" decoding="async" />
          </figure>
          <a className="store-button" href={project.externalUrl} target="_blank" rel="noreferrer">
            <AppIcon project={project} />
            <span className="store-button-copy">
              <strong>{project.externalLabel}</strong>
            </span>
            <span className="store-button-arrow" aria-hidden="true">↗</span>
          </a>
        </section>

        <section className="project-overview">
          <div className="project-meta">
            <p><span>Year</span><strong>{project.year}</strong></p>
            <p><span>Role</span><strong>{project.role}</strong></p>
          </div>
          <div className="project-copy">
            <p>{project.description}</p>
            <blockquote>{project.note}</blockquote>
          </div>
        </section>

        {project.latestRelease && (
          <section className="project-release" aria-labelledby={`release-${project.slug}`}>
            <div className="project-release-copy">
              <p>NEW RELEASE</p>
              <span>{project.latestRelease.format}</span>
              <h2 id={`release-${project.slug}`}>{project.latestRelease.title}</h2>
              <p>{project.latestRelease.description}</p>
              <a href={project.latestRelease.url} target="_blank" rel="noreferrer">
                Watch on YouTube <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="project-release-film">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${project.latestRelease.youtubeId}?rel=0`}
                title={`${project.latestRelease.title} — ${project.latestRelease.format}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {project.model && (
          <section className="model-section" aria-labelledby={`model-${project.slug}`}>
            <div className="model-heading">
              <div>
                <p>{project.model.eyebrow}</p>
                <span>{project.model.version}</span>
                <h2 id={`model-${project.slug}`}>{project.model.title}</h2>
              </div>
              <p>{project.model.description}</p>
            </div>
            <div className="model-principles">
              {project.model.principles.map((principle, principleIndex) => (
                <article key={principle.title}>
                  <span>{String(principleIndex + 1).padStart(2, "0")}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {renderMediaGallery(leadMedia)}

        {project.livePreview && (
          <section className="live-demo-section" aria-label={`${project.title} live demo`}>
            <div className="live-demo-heading">
              <div>
                <p>LIVE DEMO</p>
                <h2>{project.livePreview.label}</h2>
              </div>
              <p>{project.livePreview.note}</p>
            </div>
            <div className="live-demo-frame" style={{ "--demo-poster": `url(${base}${project.hero.displaySrc ?? project.hero.src})` } as CSSProperties}>
              <div className="live-demo-bar" aria-hidden="true">
                <span><i /><i /><i /></span>
                <b>{project.livePreview.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</b>
                <a href={project.livePreview.url} target="_blank" rel="noreferrer" tabIndex={-1}>Open ↗</a>
              </div>
              <iframe
                className="live-demo-embed"
                src={project.livePreview.url}
                title={`${project.title} interactive demo`}
                loading="lazy"
                allow="autoplay; clipboard-write; fullscreen; gamepad"
                allowFullScreen
                tabIndex={-1}
              />
            </div>
            <a className="live-demo-fallback" href={project.livePreview.url} target="_blank" rel="noreferrer">Open the full project in a new window <span>↗</span></a>
          </section>
        )}

        {renderMediaGallery(galleryMedia)}

        <section className="feature-section">
          <div className="section-kicker"><span>What it does</span><i /></div>
          <div className="feature-grid">
            {project.features.map((feature, featureIndex) => (
              <article key={feature.title}>
                <span>{String(featureIndex + 1).padStart(2, "0")}</span>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {project.caseStudy && (
          <section className="case-study-section" aria-labelledby={`case-study-${project.slug}`}>
            <header className="case-study-heading">
              <div>
                <p>CASE STUDY</p>
                <h2 id={`case-study-${project.slug}`}>Behind the work</h2>
              </div>
              <p>{project.caseStudy.summary}</p>
            </header>

            <article className="case-study-problem">
              <span>01 / The problem</span>
              <p>{project.caseStudy.problem}</p>
            </article>

            <div className="case-study-ownership">
              <article>
                <span>Exact role</span>
                <p>{project.caseStudy.exactRole}</p>
              </article>
              <article>
                <span>Team</span>
                <p>{project.caseStudy.collaboration}</p>
              </article>
            </div>

            <div className="case-study-evidence">
              {[
                { number: "02", title: "Key decisions", items: project.caseStudy.decisions },
                { number: "03", title: "Limits & misses", items: project.caseStudy.constraints },
                { number: "04", title: "Results", items: project.caseStudy.results },
                { number: "05", title: "What I built", items: project.caseStudy.built },
              ].map(({ number, title, items }) => (
                <article key={title}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <ul>
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>

      <footer className="next-project">
        <p>Up next</p>
        <Link href={`/projects/${next.slug}`}>
          <AppIcon project={next} />
          <span><small>{next.category}</small><strong>{next.title}</strong></span>
          <b>→</b>
        </Link>
      </footer>
    </main>
  );
}
