import { StudioDolly } from "../_components/StudioDolly";

/* The description is the lede, because those are the same sentence doing the
   same job in two places — one on the page, one in a search result and a link
   preview. When the lede was rewritten this was left behind still describing
   the page in the old words, which is the copy nobody proofreads because
   nobody looking at the site ever sees it. */
export const metadata = {
  title: "Shift-9 — The Studio",
  description:
    "Twelve projects, one continuous take. The finished ones look finished. The ones still in development don't — and I left them that way on purpose.",
};

export default function StudioPage() {
  return <StudioDolly />;
}
