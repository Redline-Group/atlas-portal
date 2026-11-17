// The top of every report page: the "report" eyebrow, the registered title as
// the h1, the intro description, and an optional muted note line. Renders as a
// fragment so its pieces sit directly in ReportShell's centered column.
import type { ReactNode } from "react";
import type { SourceClass } from "@/lib/provenance/sources";
import { SourceMarks } from "../SourceMark";

export function ReportHeader({
  title,
  description,
  note,
  noteTitle,
  sources = [],
}: {
  title: string;
  description?: ReactNode;
  note?: ReactNode;
  noteTitle?: string;
  /** What the report draws on besides Atlas text; chips under the title. */
  sources?: readonly SourceClass[];
}) {
  return (
    <>
      <p className="mono text-xs text-tan-3 mb-1">report</p>
      <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--tan)" }}>
        {title}
      </h1>
      <SourceMarks sources={sources} className="mb-2" />
      {description && (
        <p className={`text-sm text-tan-3 ${note ? "mb-1" : "mb-5"}`}>{description}</p>
      )}
      {note && (
        <p className="mono text-xs text-tan-3 mb-4" title={noteTitle}>
          {note}
        </p>
      )}
    </>
  );
}
