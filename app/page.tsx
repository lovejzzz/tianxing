import { PhoneExperience } from "./components/PhoneExperience";
import { FluidHeartNote } from "./components/FluidHeartNote";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <FluidHeartNote />
      <PhoneExperience />
    </main>
  );
}
