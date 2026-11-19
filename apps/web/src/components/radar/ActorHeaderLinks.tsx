import { Link } from "../Link";
import { AtlasLink } from "../AtlasLink";
import type { ActorProfile } from "../../lib/actorIndex";
import { atlasHref, actorHref } from "@/lib/routes";

export function ActorHeaderLinks({ profile }: { profile: ActorProfile }) {
  const { definingDoc, partOfComposite } = profile;
  return (
    <>
      {definingDoc && (
        <AtlasLink
          to={atlasHref(definingDoc.id)}
          className="mono text-[10px] text-accent hover:underline"
        >
          {definingDoc.doc_no} <span className="enlargen">→</span>
        </AtlasLink>
      )}
      {partOfComposite?.slug && (
        <Link
          to={actorHref(partOfComposite.slug)}
          className="mono text-[10px] text-tan-3 hover:text-accent hover:underline"
        >
          part of {partOfComposite.name} <span className="enlargen">→</span>
        </Link>
      )}
    </>
  );
}
