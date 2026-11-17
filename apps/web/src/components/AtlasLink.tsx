import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { useSearchParams } from "wouter";
import { Link } from "./Link";
import { ROUTES } from "@/lib/routes";
import { track } from "../lib/analytics";
import { hiddenTargetHref, useFilterHides } from "../lib/atlasFilter";
import { docIdFromPath } from "../lib/visitHistory";
import { useDocLinkShiftClick } from "./atlas/AtlasActionsContext";

// Like <Link>, but when the destination is /atlas, folds ?split=, ?subset=
// (with a preview's ?change= filters) and a preview's ?base= from the current
// URL into the target so the comparison pane, the changed/selected-only
// filter and the diff base persist across atlas-internal navigation and
// across search → atlas navigation. A target the filter hides goes where
// hiddenTargetHref says, usually the comparison pane. From any other route (no
// split/subset/base in URL) it is a no-op equivalent to <Link>. Inside the
// reader a shift-click on a doc link follows the row gesture (useDocLinkShiftClick).
interface Props extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  to: string;
  /** A plain click runs this instead of following the href: the caller's own
   *  navigation (a panel's tracked nav, a reader action that keeps ?view=). The
   *  href still serves middle-click, open-in-new-tab and copy. */
  onOpen?: () => void;
}

type Folded = { href: string; splitId: string | null };

// A destination that names its own subset or split chose them, so it is left
// as written. One that names a panel (?view=) is read unfiltered, since the
// comparison pane has no panels to show it in.
function foldHidden(np: URLSearchParams, target: string, live: URLSearchParams): Folded {
  if (np.has("view")) {
    const split = live.get("split");
    const base = live.get("base");
    if (split && split !== target) np.set("split", split);
    if (base && !np.has("base")) np.set("base", base);
    return { href: `${ROUTES.ATLAS}?${np}`, splitId: null };
  }
  const { kind, href } = hiddenTargetHref(target, live);
  return { href, splitId: kind === "split" && live.get("split") !== target ? target : null };
}

function foldParams(to: string, live: URLSearchParams, filterHides: (id: string) => boolean): Folded {
  const split = live.get("split");
  const subset = live.get("subset");
  const base = live.get("base");
  if (!(split || subset || base) || !to.startsWith(`${ROUTES.ATLAS}?`)) return { href: to, splitId: null };
  const [, query = ""] = to.split("?", 2);
  const np = new URLSearchParams(query);
  const target = np.get("id");
  const chosen = np.has("subset") || np.has("split");
  if (target && !chosen && filterHides(target)) return foldHidden(np, target, live);
  if (split && !np.has("split")) np.set("split", split);
  if (subset && !np.has("subset")) {
    np.set("subset", subset);
    const change = live.get("change");
    if (change) np.set("change", change);
  }
  if (base && !np.has("base")) np.set("base", base);
  return { href: `${ROUTES.ATLAS}?${np}`, splitId: null };
}

export const AtlasLink = forwardRef<HTMLAnchorElement, Props>(function AtlasLink(
  { to, onOpen, onClick, onClickCapture, ...rest },
  ref,
) {
  const [params] = useSearchParams();
  const filterHides = useFilterHides();
  const shiftClick = useDocLinkShiftClick();
  const { href, splitId } = foldParams(to, params, filterHides);
  // Capture phase: wouter's Link drops every modifier click before calling
  // onClick, so a shift-click has to be taken here or not at all.
  const handleClickCapture = (e: MouseEvent<HTMLAnchorElement>) => {
    onClickCapture?.(e);
    if (!e.shiftKey || e.defaultPrevented) return;
    const docId = docIdFromPath(to);
    if (docId) shiftClick(e, docId);
  };
  // Only a plain click reaches this: wouter's Link filters the rest out first.
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // A caller that handled the click itself (preventDefault) tracks its own navigation.
    if (e.defaultPrevented) return;
    if (onOpen) {
      e.preventDefault();
      onOpen();
    } else if (splitId) {
      track("atlas_split_open", { node_id: params.get("id"), split_id: splitId, via: "filtered" });
    }
  };
  return <Link ref={ref} to={href} onClick={handleClick} onClickCapture={handleClickCapture} {...rest} />;
});
