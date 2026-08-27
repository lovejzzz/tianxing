import { PhoneExperience } from "./components/PhoneExperience";
import { FluidHeartNote } from "./components/FluidHeartNote";
import { preload } from "react-dom";

export default function Home() {
  preload("/media/ios4/water-drops.webp", { as: "image", type: "image/webp", fetchPriority: "high" });

  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <FluidHeartNote />
      <PhoneExperience />
    </main>
  );
}
