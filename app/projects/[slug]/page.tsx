import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "../../components/AppIcon";
import { FilmPlayer } from "../../components/FilmPlayer";
import { SiteFooter } from "../../components/SiteFooter";
import { YouTubeFacade } from "../../components/YouTubeFacade";
import { getProject, projects, shownProjects } from "../../projects";

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
  // A hidden project still points onward to the one after it.
  const index = projects.findIndex((item) => item.slug === project.slug);
  const next = projects.slice(index + 1).concat(projects.slice(0, index)).find((item) => !item.hidden) ?? shownProjects[0];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const leadMediaIndexes = new Set(project.leadMedia ?? []);
  const leadMedia = project.media.filter((_, mediaIndex) => leadMediaIndexes.has(mediaIndex));
  const galleryMedia = project.media.filter((item, mediaIndex) => (
    item.gallery !== false
    && !leadMediaIndexes.has(mediaIndex)
    && (project.hero.repeatInGallery || item.src !== project.hero.src)
  ));
  const heroContain = project.hero.fit === "contain";
  // Portrait app screenshots carry their own title text, which would fight the
  // card's title; those projects lend their icon painting to the card instead.
  const nextUsesArt = next.hero.fit === "contain";
  const nextStill = nextUsesArt ? `/art/work-icons/optimized/${next.slug}.webp` : (next.hero.displaySrc ?? next.hero.src);

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
                <a className="media-image-link" href={item.href ?? `${base}${item.src}`} target="_blank" rel="noreferrer" aria-label={item.href ? `${item.linkLabel ?? "Open"}: ${item.alt}` : `View full resolution: ${item.alt}`}>
                  {/* Raw screenshots keep their native aspect ratios and never render wider than their source pixels. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${base}${item.displaySrc ?? item.src}`} alt={item.alt} width={item.width} height={item.height} loading={mediaIndex ? "lazy" : "eager"} decoding="async" />
                  <span>{`${item.href ? (item.linkLabel ?? "Open") : "Full resolution"} ↗`}</span>
                </a>
              )}
              {item.type === "video" && <video src={`${base}${item.src}`} aria-label={item.alt} controls muted loop playsInline preload="metadata" poster={item.poster ? `${base}${item.poster}` : undefined} />}
              {item.type === "youtube" && (
                <YouTubeFacade id={item.src} title={item.alt} poster={item.poster ? `${base}${item.poster}` : undefined} label="Play video" />
              )}
            </div>
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        );
      })}
    </section>
  );

  return (
    <main className={`detail-page accent-${project.accent}`}>
      <a className="skip-link" href="#project-content">Skip to project content</a>
      <header className="detail-nav">
        <Link className="back-button" href="/" aria-label="Back to all projects"><span aria-hidden="true">‹</span> Projects</Link>
        <Link className="wordmark" href="/">Tian Xing <small>Selected work</small></Link>
        <Link className="about-button" href="/about">About</Link>
      </header>

      <article id="project-content">
        <section className="project-hero">
          <div className="project-identity">
            <p className="project-category">{project.category}</p>
            <h1>
              {project.title}
              {project.badge && (
                <span className={`title-badge${project.badge.label ? "" : " is-single"}`} role="note" aria-label={[project.badge.label, project.badge.value].filter(Boolean).join(" ")}>
                  {project.badge.label && <small>{project.badge.label}</small>}<b>{project.badge.value}</b>
                </span>
              )}
            </h1>
            {project.currentRelease && (
              <a className="release-chip" href={project.update ? `#whats-new-${project.slug}` : project.versions ? `#versions-${project.slug}` : project.externalUrl}>
                <b>{project.currentRelease.version}</b>
                <span>New · {project.currentRelease.headline}</span>
              </a>
            )}
            <p className="project-tagline">{project.tagline}</p>
            <a className="store-button" href={project.externalUrl} target="_blank" rel="noreferrer">
              <AppIcon project={project} />
              <span className="store-button-copy">
                <strong>{project.externalLabel}</strong>
              </span>
              <span className="store-button-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <figure
            className={`project-hero-visual${heroContain ? " project-hero-contain" : ""}`}
            style={{
              "--hero-position": project.hero.position ?? "50% 50%",
              "--hero-zoom": project.hero.zoom ?? 1,
              ...(project.hero.aspect ? { "--hero-aspect": project.hero.aspect } : {}),
            } as CSSProperties}
          >
            {project.hero.href ? (
              <a className="project-hero-link" href={project.hero.href} target="_blank" rel="noreferrer" aria-label={`${project.externalLabel}: ${project.hero.alt}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${base}${project.hero.displaySrc ?? project.hero.src}`} alt={project.hero.alt} width={project.hero.width} height={project.hero.height} fetchPriority="high" decoding="async" />
              </a>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`${base}${project.hero.displaySrc ?? project.hero.src}`} alt={project.hero.alt} width={project.hero.width} height={project.hero.height} fetchPriority="high" decoding="async" />
            )}
          </figure>
        </section>

        <section className="project-overview">
          <dl className="project-meta">
            <div><dt>Year</dt><dd>{project.year}</dd></div>
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Field</dt><dd>{project.category}</dd></div>
          </dl>
          <div className="project-copy">
            <p>{project.description}</p>
            <blockquote>{project.note}</blockquote>
          </div>
        </section>

        {project.update && (
          <section className="update-section" id={`whats-new-${project.slug}`} aria-labelledby={`whats-new-title-${project.slug}`}>
            <div className="update-heading">
              <div>
                <p className="eyebrow">WHAT’S NEW <span>{project.update.version} · {project.update.date}</span></p>
                <h2 id={`whats-new-title-${project.slug}`}>{project.update.title}</h2>
              </div>
              <p>{project.update.description}</p>
            </div>
            <div className="update-headliners">
              {project.update.headliners.map((item, index) => (
                <article key={item.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${base}${item.image}`} alt={item.alt} width={800} height={416} loading="lazy" decoding="async" />
                  <h3><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            {project.update.shelf && (
              <div className="update-shelf">
                <header>
                  <h3>{project.update.shelf.title}</h3>
                  <p>{project.update.shelf.description}</p>
                </header>
                <ul>
                  {project.update.shelf.items.map((item) => (
                    <li key={item.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${base}${item.image}`} alt={`Film poster for the ${item.name} shell`} width={360} height={540} loading="lazy" decoding="async" />
                      <strong>{item.name}</strong>
                      <small>{item.group}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="update-more">
              <h3>Also in {project.update.version}</h3>
              <ul>
                {project.update.more.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          </section>
        )}

        {project.featuredFilm && (
          <section className={`project-release${project.featuredFilm.portrait ? " project-release-portrait" : ""}`} aria-labelledby={`release-${project.slug}`}>
            <div className="project-release-copy">
              <p className="eyebrow">{project.featuredFilm.portrait ? "APP PREVIEW" : "FEATURED FILM"}</p>
              <h2 id={`release-${project.slug}`}>{project.featuredFilm.title}</h2>
              <span>{project.featuredFilm.format}</span>
              <p>{project.featuredFilm.description}</p>
              <a href={project.featuredFilm.url} target="_blank" rel="noreferrer">
                {project.featuredFilm.linkLabel ?? "Watch on YouTube"} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="project-release-film">
              {project.featuredFilm.src ? (
                <FilmPlayer
                  src={`${base}${project.featuredFilm.src}`}
                  title={`${project.featuredFilm.title} — ${project.featuredFilm.format}`}
                  poster={project.featuredFilm.poster ? `${base}${project.featuredFilm.poster}` : undefined}
                  label={project.featuredFilm.portrait ? "Play preview" : "Play film"}
                />
              ) : project.featuredFilm.youtubeId && (
                <YouTubeFacade
                  id={project.featuredFilm.youtubeId}
                  title={`${project.featuredFilm.title} — ${project.featuredFilm.format}`}
                  poster={project.featuredFilm.poster ? `${base}${project.featuredFilm.poster}` : undefined}
                />
              )}
            </div>
          </section>
        )}

        {project.model && (
          <section className="model-section" data-mark={project.model.mark} aria-labelledby={`model-${project.slug}`}>
            <div className="model-heading">
              <div>
                <p className="eyebrow">{project.model.eyebrow} <span>{project.model.version}</span></p>
                <h2 id={`model-${project.slug}`}>{project.model.title}</h2>
              </div>
              <p>{project.model.description}</p>
            </div>
            <div className="model-principles">
              {project.model.principles.map((principle) => (
                <article key={principle.title}>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {project.cast && (
          <section className="cast-section" aria-labelledby={`cast-${project.slug}`}>
            <div className="cast-heading">
              <div>
                <p className="eyebrow">{project.cast.eyebrow}</p>
                <h2 id={`cast-${project.slug}`}>{project.cast.title}</h2>
              </div>
              <p>{project.cast.description}</p>
            </div>
            <ol className="cast-cards">
              {project.cast.members.map((member, memberIndex) => (
                <li key={member.name}>
                  <p className="cast-rung">Rung {memberIndex + 1} of {project.cast!.members.length}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${base}${member.image}`} alt={`${member.name}, ${member.role}`} width={480} height={480} loading="lazy" decoding="async" />
                  <h3>{member.name}<span>{member.role}</span></h3>
                  <p className="cast-quote">{member.quote}</p>
                  <dl>
                    {member.facts.map((fact) => (
                      <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
          </section>
        )}

        {renderMediaGallery(leadMedia)}

        {project.livePreview && (
          <section className="live-demo-section" aria-label={`${project.title} live demo`}>
            <div className="live-demo-heading">
              <div>
                <p className="eyebrow">LIVE DEMO</p>
                <h2>{project.livePreview.label}</h2>
              </div>
              <p>{project.livePreview.note}</p>
            </div>
            <div className="live-demo-frame" style={{ "--demo-poster": `url(${base}${project.hero.displaySrc ?? project.hero.src})` } as CSSProperties}>
              <div className="live-demo-bar">
                <span aria-hidden="true"><i /><i /><i /></span>
                <b>{project.livePreview.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</b>
                <a href={project.livePreview.url} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} in a new window`}>Open ↗</a>
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
          </section>
        )}

        {renderMediaGallery(galleryMedia)}

        <section className="feature-section" aria-labelledby={`features-${project.slug}`}>
          <p className="eyebrow" id={`features-${project.slug}`}>What it does</p>
          <div className="feature-grid">
            {project.features.map((feature) => (
              <article key={feature.title}>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {project.versions && (
          <section className="versions-section" id={`versions-${project.slug}`} aria-labelledby={`versions-title-${project.slug}`}>
            <div className="versions-heading">
              <div>
                <p className="eyebrow">{project.versions.eyebrow} <span>{project.versions.releases[0].version} → {project.versions.releases.at(-1)?.version}</span></p>
                <h2 id={`versions-title-${project.slug}`}>{project.versions.title}</h2>
              </div>
              <p>{project.versions.description}</p>
            </div>
            <ol className="versions-track" style={{ "--release-count": project.versions.releases.length } as CSSProperties}>
              {project.versions.releases.map((release, releaseIndex, releases) => {
                const current = releaseIndex === releases.length - 1;
                return (
                  <li
                    key={release.version}
                    className={current ? "is-current" : undefined}
                    aria-current={current ? "step" : undefined}
                    style={{ "--release-rise": (releaseIndex + 1) / releases.length } as CSSProperties}
                  >
                    <span className="versions-bar" aria-hidden="true" />
                    <span className="versions-node" aria-hidden="true" />
                    <p className="versions-meta"><time>{release.date}</time>{current && <em>Current</em>}</p>
                    <h3><span>v</span>{release.version}</h3>
                    <p className="versions-title">{release.title}</p>
                    <ul>
                      {release.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {project.predecessor && (
          <section className="predecessor-section" aria-labelledby={`predecessor-${project.slug}`}>
            <div className="predecessor-heading">
              <div>
                <p className="eyebrow">{project.predecessor.eyebrow} <span>{project.predecessor.version}</span></p>
                <h2 id={`predecessor-${project.slug}`}>{project.predecessor.title}</h2>
              </div>
              <p>{project.predecessor.description}</p>
            </div>
            <div className="predecessor-body">
              <a className="predecessor-still" href={project.predecessor.url} target="_blank" rel="noreferrer" aria-label={`${project.predecessor.linkLabel}: ${project.predecessor.title}`}>
                <span className="media-chrome" aria-hidden="true"><i /><i /><i /><span>{project.predecessor.url.replace(/^https?:\/\//, "")}</span></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${base}${project.predecessor.image.displaySrc ?? project.predecessor.image.src}`} alt={project.predecessor.image.alt} width={project.predecessor.image.width} height={project.predecessor.image.height} loading="lazy" decoding="async" />
                <span className="predecessor-still-label" aria-hidden="true">{`${project.predecessor.linkLabel} ↗`}</span>
              </a>
              <div className="predecessor-lessons">
                {project.predecessor.lessons.map((lesson) => (
                  <article key={lesson.title}>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.body}</p>
                  </article>
                ))}
                <a className="predecessor-link" href={project.predecessor.url} target="_blank" rel="noreferrer">
                  {project.predecessor.linkLabel} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {project.caseStudy && (
          <section className="case-study-section" aria-labelledby={`case-study-${project.slug}`}>
            <header className="case-study-heading">
              <div>
                <p className="eyebrow">CASE STUDY</p>
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
                  <h3><span>{number}</span>{title}</h3>
                  <ul>
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>

      <nav className="next-project" aria-label="Next project">
        <Link href={`/projects/${next.slug}`} className={nextUsesArt ? "is-art" : undefined} style={{ "--next-still": `url(${base}${nextStill})`, "--next-position": nextUsesArt ? "50% 50%" : (next.hero.position ?? "50% 50%") } as CSSProperties}>
          <span className="next-project-label">Up next</span>
          <span className="next-project-title">
            <AppIcon project={next} />
            <span><small>{next.category}</small><strong>{next.title}</strong></span>
          </span>
          <b aria-hidden="true">→</b>
        </Link>
      </nav>

      <SiteFooter />
    </main>
  );
}
