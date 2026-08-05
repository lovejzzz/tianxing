/* eslint-disable @next/next/no-img-element */
import type { Project } from "../projects";

export function AppIcon({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <span className={`app-icon icon-${project.slug} ${large ? "app-icon-large" : ""}`} aria-hidden="true">
      <span className="icon-gloss" />
      <span className="app-icon-art">
        <img src={`/art/work-icons/${project.slug}.png`} alt="" draggable={false} />
      </span>
    </span>
  );
}
