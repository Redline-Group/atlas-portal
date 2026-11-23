import { SectionHeading } from "./PaletteSection";
import { SwatchGrid, type SwatchGridProps } from "./SwatchGrid";
import { GROUP_LABEL, TOKENS_BY_GROUP, type PaletteGroup } from "./palette-tokens";

export type TokenGroupSectionProps = Omit<SwatchGridProps, "tokens"> & {
  /** The semantic token group this section lists. */
  group: PaletteGroup;
};

/** One semantic token group: its heading over its swatches. Renders nothing for an empty group. */
export function TokenGroupSection({ group, ...grid }: TokenGroupSectionProps) {
  const tokens = TOKENS_BY_GROUP.get(group);
  if (!tokens || tokens.length === 0) return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeading gap={10}>{GROUP_LABEL[group]}</SectionHeading>
      <SwatchGrid tokens={tokens} {...grid} />
    </section>
  );
}
