import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Martian_Mono,
} from "next/font/google";

/* ────────────────────────────────────────────────────────────────────────
   THE HOUSE STACK — loaded once, in one place.

   Every next/font call is a separate self-hosted font file. Calling the same
   family twice does not deduplicate: the browser downloads it twice. The
   layout was loading Bricolage Grotesque and Instrument Sans for the site,
   and the studio's per-project map was loading both again for the one project
   that uses the house face — two extra files for zero extra typefaces.

   So they live here. The layout consumes `.variable` to publish the CSS
   custom properties; the studio's map consumes `.style.fontFamily` to hand a
   family to one card. Same instance, same file, both jobs.
   ──────────────────────────────────────────────────────────────────────── */

export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display-src",
  display: "swap",
});

export const text = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-text-src",
  display: "swap",
});

export const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  display: "swap",
});
