// Which on-chain addresses a preview brings in: named by a document the branch
// adds or changes, and by nothing on its diff base or live main.
import { describe, expect, test } from "bun:test";
import { introducedAddresses } from "./diff-addresses.ts";
import type { Snapshot, SnapshotDoc } from "./snapshot.ts";

const snap = (docs: SnapshotDoc[]): Snapshot => new Map(docs.map((d) => [d.id, d]));
const doc = (id: string, content: string): SnapshotDoc => ({ id, doc_no: `A.${id}`, content });

const SPARK = "0x492aae70E59551768BAF3c7159d3f951B6ed76Fe";
const FRESH = "0xabcdef0000000000000000000000000000000001";
const SOL = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

describe("introducedAddresses", () => {
  test("an address no base document names is new, keyed lowercase", () => {
    const head = snap([doc("1", "The address is `0xAbCdEf0000000000000000000000000000000001`.")]);
    expect(introducedAddresses(["1"], snap([]), head)).toEqual([FRESH]);
  });

  test("an address only a document the branch removed named is not new", () => {
    // The Spark Operator Multisig's address moves from the Arbitrum doc the
    // branch deletes to a new Ethereum doc.
    const base = snap([doc("old", `The address on Arbitrum is \`${SPARK}\`.`)]);
    const head = snap([doc("new", `The address on the Ethereum Mainnet is \`${SPARK}\`.`)]);
    expect(introducedAddresses(["new"], base, head)).toEqual([]);
  });

  test("an address live main already names is not new", () => {
    const head = snap([doc("1", `Pays \`${FRESH}\`.`)]);
    const live = snap([doc("2", `Pays \`${FRESH}\`.`)]);
    expect(introducedAddresses(["1"], snap([]), head)).toEqual([FRESH]);
    expect(introducedAddresses(["1"], snap([]), head, live)).toEqual([]);
  });

  test("only the listed documents are read, and a longer hex string is not an address", () => {
    const head = snap([doc("1", `Tx 0x${"ab".repeat(32)}.`), doc("2", `Unchanged \`${FRESH}\`.`)]);
    expect(introducedAddresses(["1"], snap([]), head)).toEqual([]);
  });

  test("a changed document that keeps its address does not make it new", () => {
    const base = snap([doc("1", `Old wording, \`${SPARK}\`.`)]);
    const head = snap([doc("1", `New wording, \`${SPARK}\`.`)]);
    expect(introducedAddresses(["1"], base, head)).toEqual([]);
  });

  test("base and live as one snapshot, and candidates of both kinds", () => {
    const base = snap([doc("2", `The program is \`${SOL}\`.`)]);
    const head = snap([doc("1", `Pays \`${FRESH}\` through \`${SOL}\`.`)]);
    expect(introducedAddresses(["1"], base, head, base)).toEqual([FRESH]);
  });

  test("a base58 address keeps its case", () => {
    const head = snap([doc("1", `The program is \`${SOL}\`.`)]);
    expect(introducedAddresses(["1"], snap([]), head)).toEqual([SOL]);
  });
});
