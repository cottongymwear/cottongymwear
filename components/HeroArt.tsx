import { Garment } from "./Garment";

const SWATCH = { black: "#141414", white: "#f7f4ee", navy: "#1b2744" };

/** Black, White, and Navy flat-lay: the three solids sold on every blank. */
export function HeroArt() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="A navy long sleeve, a black tee, and a white tank laid flat"
      focusable="false"
    >
      <Garment kind="long-sleeve" swatch={SWATCH.navy} transform="translate(236 104) rotate(-7 200 240) scale(1.08)" />
      <Garment kind="tank" swatch={SWATCH.white} transform="translate(582 110) rotate(6 200 240) scale(1.08)" />
      <Garment kind="tee" swatch={SWATCH.black} transform="translate(380 90) scale(1.1)" />
    </svg>
  );
}
