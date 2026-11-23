import { Link } from "../Link";
import { instanceAnchor } from "@/lib/radarAnchors";
import { actorPageHref } from "@/lib/routes";

export interface FacilitySubscriber {
  instanceId: string;
  instanceName: string;
  prime: { slug: string; name: string } | null;
}

/** The Prime Agents whose instances subscribe to a facility, each linked to that instance's card. */
export function FacilitySubscribers({ subscribers }: { subscribers: FacilitySubscriber[] }) {
  if (subscribers.length === 0) return <>No Prime Agent lists it as an instance yet.</>;
  return (
    <>
      Subscribed to by{" "}
      {subscribers.map((s, i) => (
        <span key={s.instanceId}>
          {i > 0 && ", "}
          {s.prime ? <Link to={actorPageHref(s.prime.slug, "primitives", instanceAnchor(s.instanceId))} className="text-accent hover:underline">{s.prime.name}</Link> : s.instanceName}
        </span>
      ))}
      .
    </>
  );
}
