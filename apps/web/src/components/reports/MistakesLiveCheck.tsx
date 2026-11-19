// The live-check lines of the Potential Mistakes provenance banner: how many
// stored findings point at a renumbered or deleted document, and how many are
// hidden because their quoted text is absent from the served atlas.
export function LiveCheckNotes({ drifted, fixed }: { drifted: number; fixed: number }) {
  return (
    <>
      {drifted > 0 && (
        <p className="text-tan-3 mt-1.5">
          Checked live against the Atlas currently being served:{" "}
          <span className="mono" style={{ color: "var(--warn)" }}>
            {drifted}
          </span>{" "}
          {drifted === 1 ? "finding targets a document that has" : "findings target documents that have"}{" "}
          been renumbered or removed since the sweep — filter by{" "}
          <span className="mono">Doc status</span> to see them.
        </p>
      )}
      {fixed > 0 && (
        <p className="text-tan-3 mt-1.5">
          <span className="mono" style={{ color: "var(--warn)" }}>
            {fixed}
          </span>{" "}
          {fixed === 1 ? "finding is" : "findings are"} hidden because the quoted text is no longer
          in the Atlas — pick <span className="mono">Doc status: Quote no longer in doc</span> to see
          them.
        </p>
      )}
    </>
  );
}
