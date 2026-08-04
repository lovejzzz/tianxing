import type { Project } from "../projects";

export function AppIcon({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <span className={`app-icon icon-${project.slug} ${large ? "app-icon-large" : ""}`} aria-hidden="true">
      <span className="icon-gloss" />
      <IconArt slug={project.slug} />
    </span>
  );
}

function IconArt({ slug }: { slug: string }) {
  switch (slug) {
    case "edutool":
      return <span className="course-art"><i /><i /><i /><b>A+</b></span>;
    case "surge-method":
      return <span className="surge-art"><i /><i /><i /><i /><i /><b>S</b></span>;
    case "bebop-puzzle":
      return <span className="bebop-art"><i>♪</i><b /><em /></span>;
    case "quicky-resume":
      return <span className="resume-art"><i /><b /><b /><b /><em /></span>;
    case "5279-emulsion":
      return <span className="film-art"><i>52</i><b>79</b><em /></span>;
    case "start-where-you-are":
      return <span className="start-art"><i /><b>START</b><em>▶</em></span>;
    case "texas-jack":
      return <span className="cards-art"><i>A♠</i><b>J♥</b><em /></span>;
    case "slotronome":
      return <span className="slot-art"><i>0</i><i>9</i><i>0</i><b /></span>;
    default:
      return <span className="channel-art"><i /><b>▶</b><em /></span>;
  }
}
