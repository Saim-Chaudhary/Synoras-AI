import Image from "next/image";

// The Synoras logo. Each variant has two files in public/: one for light backgrounds and
// one for dark backgrounds. Both are in the page, and the CSS shows the one that fits the
// current theme (the "dark:" variant in globals.css follows the data-theme attribute).
//   full = the mark with the name   (login and register pages)
//   mark = the mark alone           (sidebar, empty chat, side panel)
const FILES = {
  full: { forLight: "/logo-full.svg", forDark: "/logo-full-dark.svg", ratio: 420 / 120 },
  mark: { forLight: "/logo-mark.svg", forDark: "/logo-mark-light.svg", ratio: 1 },
};

type Props = {
  variant: "full" | "mark";
  height: number; // in pixels; the width follows from the shape of the logo
  priority?: boolean; // true for logos that are visible as soon as the page opens
};

export default function Logo({ variant, height, priority }: Props) {
  const { forLight, forDark, ratio } = FILES[variant];
  const width = Math.round(height * ratio);
  return (
    <>
      <Image
        src={forLight}
        alt="Synoras AI"
        width={width}
        height={height}
        priority={priority}
        className="dark:hidden"
      />
      <Image
        src={forDark}
        alt=""
        width={width}
        height={height}
        priority={priority}
        className="hidden dark:block"
      />
    </>
  );
}
