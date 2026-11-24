import { describe, it, expect } from "vitest";
import { findCousinDocs } from "./cousins";
import { makeNode, makeAtlasBundle, makeGraphEntity, makeGraphData } from "../test/fixtures";
import { MAX_COUSINS } from "./cousinRank";

// Two primes (Spark, Grove) each with a token instance; Grove also has an
// unrelated executor-accord instance and Spark a token *invocation* — neither
// should surface as a cousin of Spark's token instance. Coverage resolution
// runs on the doc_no ancestor chain, so parentId is deliberately left unset.
function fixture() {
  const sparkRoot = makeNode({ id: "spark-root", doc_no: "A.6.1.1.1", title: "Spark" });
  const groveRoot = makeNode({ id: "grove-root", doc_no: "A.6.1.1.2", title: "Grove" });
  const sparkToken = makeNode({ id: "spark-token", doc_no: "A.6.1.1.1.2.1", title: "Token" });
  const sparkTokenParam = makeNode({ id: "spark-token-param", doc_no: "A.6.1.1.1.2.1.1", title: "Token Name" });
  const sparkTokenSymbol = makeNode({ id: "spark-token-symbol", doc_no: "A.6.1.1.1.2.1.2", title: "Token Symbol" });
  const groveToken = makeNode({ id: "grove-token", doc_no: "A.6.1.1.2.2.1", title: "Token" });
  const groveTokenParam = makeNode({ id: "grove-token-param", doc_no: "A.6.1.1.2.2.1.1", title: "Token Name" });
  const groveAccord = makeNode({ id: "grove-accord", doc_no: "A.6.1.1.2.2.2", title: "Executor Accord" });
  const sparkTokenInvo = makeNode({ id: "spark-token-invo", doc_no: "A.6.1.1.1.2.3", title: "Token Invocation" });
  const atlas = makeAtlasBundle([sparkRoot, groveRoot, sparkToken, sparkTokenParam, sparkTokenSymbol, groveToken, groveTokenParam, groveAccord, sparkTokenInvo]);

  const graph = makeGraphData({
    participants: [
      makeGraphEntity({ id: sparkRoot.id, name: "Spark", et: "agent", st: "prime", did: sparkRoot.id }),
      makeGraphEntity({ id: groveRoot.id, name: "Grove", et: "agent", st: "prime", did: groveRoot.id }),
    ],
    instances: [
      makeGraphEntity({ id: "i-spark-token", st: "token", did: sparkToken.id, m: JSON.stringify({ agent_doc_id: sparkRoot.id }) }),
      makeGraphEntity({ id: "i-grove-token", st: "token", did: groveToken.id, m: JSON.stringify({ agent_doc_id: groveRoot.id }) }),
      makeGraphEntity({ id: "i-grove-accord", st: "executor-accord", did: groveAccord.id, m: JSON.stringify({ agent_doc_id: groveRoot.id }) }),
    ],
    invocations: [
      makeGraphEntity({ id: "v-spark-token", et: "invocation", st: "token", did: sparkTokenInvo.id, m: JSON.stringify({ agent_doc_id: sparkRoot.id }) }),
    ],
  });
  return { atlas, graph, sparkToken, sparkTokenParam, sparkTokenSymbol, groveToken, groveTokenParam };
}

describe("findCousinDocs", () => {
  it("maps an instance doc to same-primitive instances under other primes", () => {
    const { atlas, graph, sparkToken, groveToken } = fixture();
    const cousins = findCousinDocs(sparkToken.id, atlas, graph);
    expect(cousins).toEqual([{ node: groveToken, agent: "Grove" }]);
  });

  it("maps a nested param to the equivalent nested param under other primes", () => {
    const { atlas, graph, sparkTokenParam, groveTokenParam } = fixture();
    const cousins = findCousinDocs(sparkTokenParam.id, atlas, graph);
    // The real cousin — Grove's *Token Name* param — not Grove's ICD root.
    expect(cousins).toEqual([{ node: groveTokenParam, agent: "Grove" }]);
  });

  it("offers no cousin when the instance has no doc of the same title", () => {
    const { atlas, graph, sparkTokenSymbol } = fixture();
    // Spark's Token Symbol has no Grove equivalent; Grove's ICD root is not a stand-in.
    expect(findCousinDocs(sparkTokenSymbol.id, atlas, graph)).toEqual([]);
  });

  it("does not cross pools: an invocation's cousins exclude instances", () => {
    const { atlas, graph } = fixture();
    expect(findCousinDocs("spark-token-invo", atlas, graph)).toEqual([]);
  });

  it("returns [] for docs outside the Prime Agent artifacts", () => {
    const { atlas, graph } = fixture();
    const other = makeNode({ id: "outside", doc_no: "A.2.1", title: "Token" });
    atlas.docs[other.id] = other;
    atlas.docNoToId.set(other.doc_no, other.id);
    expect(findCousinDocs(other.id, atlas, graph)).toEqual([]);
  });

  it("matches titles that differ only by the agent's name or by spacing", () => {
    const { atlas, graph } = fixture();
    const add = (id: string, doc_no: string, title: string) => {
      const n = makeNode({ id, doc_no, title });
      atlas.docs[id] = n;
      atlas.docNoToId.set(doc_no, id);
      return n;
    };
    const sparkLayer = add("s-layer", "A.6.1.1.1.2.1.3", "Spark Liquidity Layer Addresses");
    const groveLayer = add("g-layer", "A.6.1.1.2.2.1.7", "Grove Liquidity Layer Addresses");
    const sparkId = add("s-rlid", "A.6.1.1.1.2.1.4", "Inflow Rate Limit ID");
    const groveId = add("g-rlid", "A.6.1.1.2.2.1.8", "Inflow RateLimitID");
    expect(findCousinDocs(sparkLayer.id, atlas, graph)).toEqual([{ node: groveLayer, agent: "Grove" }]);
    expect(findCousinDocs(sparkId.id, atlas, graph)).toEqual([{ node: groveId, agent: "Grove" }]);
  });

  it("returns [] when the entity has no agent_doc_id meta", () => {
    const { atlas, graph, sparkToken } = fixture();
    graph.instances[0].m = undefined;
    expect(findCousinDocs(sparkToken.id, atlas, graph)).toEqual([]);
  });

  it("resolves to the nearest covering entity when nested inside another", () => {
    // Spark's "Reward" instance sits *inside* Spark's "Token" instance subtree,
    // so both structurally cover the reward doc. The ancestor chain is walked
    // deepest-first, so it must resolve to the reward entity (→ reward cousins),
    // not the enclosing token entity (which would wrongly yield Grove's Token).
    const sparkRoot = makeNode({ id: "s-root", doc_no: "A.6.1.1.1", title: "Spark" });
    const groveRoot = makeNode({ id: "g-root", doc_no: "A.6.1.1.2", title: "Grove" });
    const sparkToken = makeNode({ id: "s-token", doc_no: "A.6.1.1.1.2.1", title: "Token" });
    const sparkReward = makeNode({ id: "s-reward", doc_no: "A.6.1.1.1.2.1.5", title: "Reward" });
    const groveToken = makeNode({ id: "g-token", doc_no: "A.6.1.1.2.2.1", title: "Token" });
    const groveReward = makeNode({ id: "g-reward", doc_no: "A.6.1.1.2.2.1.5", title: "Reward" });
    const atlas = makeAtlasBundle([sparkRoot, groveRoot, sparkToken, sparkReward, groveToken, groveReward]);
    const graph = makeGraphData({
      participants: [
        makeGraphEntity({ id: sparkRoot.id, name: "Spark", et: "agent", st: "prime", did: sparkRoot.id }),
        makeGraphEntity({ id: groveRoot.id, name: "Grove", et: "agent", st: "prime", did: groveRoot.id }),
      ],
      instances: [
        makeGraphEntity({ id: "i-s-token", st: "token", did: sparkToken.id, m: JSON.stringify({ agent_doc_id: sparkRoot.id }) }),
        makeGraphEntity({ id: "i-s-reward", st: "reward", did: sparkReward.id, m: JSON.stringify({ agent_doc_id: sparkRoot.id }) }),
        makeGraphEntity({ id: "i-g-token", st: "token", did: groveToken.id, m: JSON.stringify({ agent_doc_id: groveRoot.id }) }),
        makeGraphEntity({ id: "i-g-reward", st: "reward", did: groveReward.id, m: JSON.stringify({ agent_doc_id: groveRoot.id }) }),
      ],
    });
    expect(findCousinDocs(sparkReward.id, atlas, graph)).toEqual([{ node: groveReward, agent: "Grove" }]);
  });
});

// Omni-doc fallback: docs parallel across agents' Omni Documents subtrees
// (A.6.1.1.X.3.*) that have no covering primitive entity, matched by exact title,
// gated on omni-share >= 0.7 and same true depth.
function omniFixture() {
  const spark = makeNode({ id: "s", doc_no: "A.6.1.1.1", title: "Spark" });
  const grove = makeNode({ id: "g", doc_no: "A.6.1.1.2", title: "Grove" });
  // Omni-specific title — appears only in the omni region (share 1.0).
  const sForum = makeNode({ id: "sf", doc_no: "A.6.1.1.1.3.1", title: "Sky Forum" });
  const gForum = makeNode({ id: "gf", doc_no: "A.6.1.1.2.3.1", title: "Sky Forum" });
  // Generic title — mostly used outside the omni region (share 2/5 = 0.4).
  const sGen = makeNode({ id: "sp", doc_no: "A.6.1.1.1.3.2", title: "Parameters" });
  const gGen = makeNode({ id: "gp", doc_no: "A.6.1.1.2.3.2", title: "Parameters" });
  const o1 = makeNode({ id: "o1", doc_no: "A.2.1", title: "Parameters" });
  const o2 = makeNode({ id: "o2", doc_no: "A.2.2", title: "Parameters" });
  const o3 = makeNode({ id: "o3", doc_no: "A.2.3", title: "Parameters" });
  // Omni-specific title but Grove's copy is one level deeper — depth guard skips it.
  const sWidget = makeNode({ id: "sw", doc_no: "A.6.1.1.1.3.5", title: "Widget" });
  const gWidget = makeNode({ id: "gw", doc_no: "A.6.1.1.2.3.5.1", title: "Widget" });
  const atlas = makeAtlasBundle([spark, grove, sForum, gForum, sGen, gGen, o1, o2, o3, sWidget, gWidget]);
  const graph = makeGraphData({
    participants: [
      makeGraphEntity({ id: spark.id, name: "Spark", et: "agent", st: "prime", did: spark.id }),
      makeGraphEntity({ id: grove.id, name: "Grove", et: "agent", st: "prime", did: grove.id }),
    ],
  });
  return { atlas, graph, sForum, gForum, sGen, sWidget };
}

describe("findCousinDocs — omni docs", () => {
  it("links an omni-specific title across agents", () => {
    const { atlas, graph, sForum, gForum } = omniFixture();
    expect(findCousinDocs(sForum.id, atlas, graph)).toEqual([{ node: gForum, agent: "Grove" }]);
  });

  it("does not link a generic title used mostly outside the omni region", () => {
    const { atlas, graph, sGen } = omniFixture();
    expect(findCousinDocs(sGen.id, atlas, graph)).toEqual([]);
  });

  it("does not link an omni doc whose cousin sits at a different depth", () => {
    const { atlas, graph, sWidget } = omniFixture();
    expect(findCousinDocs(sWidget.id, atlas, graph)).toEqual([]);
  });
});

// Multi-instance primitive (Allocation System): ICDs filed by status › chain ›
// venue. Spark has two Morpho vaults and an Aave market; Grove has a Morpho
// vault (whose Owner Role Address sits at a different path) and a completed one.
function venueFixture() {
  const docs: ReturnType<typeof makeNode>[] = [];
  const add = (id: string, doc_no: string, title: string) => {
    const n = makeNode({ id, doc_no, title });
    docs.push(n);
    return n;
  };
  add("s", "A.6.1.1.1", "Spark");
  add("g", "A.6.1.1.2", "Grove");
  add("s-act", "A.6.1.1.1.2.6.1.3", "Active Instances");
  add("s-eth", "A.6.1.1.1.2.6.1.3.1", "Ethereum Mainnet Instances");
  add("s-morpho", "A.6.1.1.1.2.6.1.3.1.3", "Morpho");
  add("s-aave", "A.6.1.1.1.2.6.1.3.1.5", "Aave");
  const sVault = add("s-v1", "A.6.1.1.1.2.6.1.3.1.3.1", "Morpho USDC Instance Configuration Document");
  const sOwner = add("s-v1-owner", "A.6.1.1.1.2.6.1.3.1.3.1.4.1.3", "Owner Role Address");
  const sVault2 = add("s-v2", "A.6.1.1.1.2.6.1.3.1.3.2", "Morpho USDT Instance Configuration Document");
  const sOwner2 = add("s-v2-owner", "A.6.1.1.1.2.6.1.3.1.3.2.4.1.3", "Owner Role Address");
  add("s-aave1", "A.6.1.1.1.2.6.1.3.1.5.1", "Aave USDC Instance Configuration Document");
  add("s-aave1-owner", "A.6.1.1.1.2.6.1.3.1.5.1.4.1.3", "Owner Role Address");
  add("g-act", "A.6.1.1.2.2.6.1.3", "Active Instances");
  add("g-eth", "A.6.1.1.2.2.6.1.3.1", "Ethereum Mainnet Instances");
  add("g-morpho", "A.6.1.1.2.2.6.1.3.1.7", "Morpho");
  add("g-v1", "A.6.1.1.2.2.6.1.3.1.7.1", "Steakhouse USDC Morpho Instance Configuration Document");
  add("g-v1-alloc", "A.6.1.1.2.2.6.1.3.1.7.1.4.1.3", "Allocator Role Addresses");
  const gOwner = add("g-v1-owner", "A.6.1.1.2.2.6.1.3.1.7.1.2.2.3", "Owner Role Address");
  add("g-done", "A.6.1.1.2.2.6.1.4", "Completed Instances");
  add("g-done-eth", "A.6.1.1.2.2.6.1.4.1", "Ethereum Mainnet Instances");
  add("g-done-morpho", "A.6.1.1.2.2.6.1.4.1.1", "Morpho");
  add("g-old", "A.6.1.1.2.2.6.1.4.1.1.1", "Old Morpho Instance Configuration Document");
  const gOldOwner = add("g-old-owner", "A.6.1.1.2.2.6.1.4.1.1.1.4.1.3", "Owner Role Address");
  const inst = (id: string, did: string, agent: string) =>
    makeGraphEntity({ id, name: `Ethereum Mainnet - ${did}`, st: "allocation-system", did, m: JSON.stringify({ agent_doc_id: agent }) });
  const graph = makeGraphData({
    participants: [
      makeGraphEntity({ id: "s", name: "Spark", et: "agent", st: "prime", did: "s" }),
      makeGraphEntity({ id: "g", name: "Grove", et: "agent", st: "prime", did: "g" }),
    ],
    instances: [inst("i1", "s-v1", "s"), inst("i2", "s-v2", "s"), inst("i3", "s-aave1", "s"), inst("i4", "g-v1", "g"), inst("i5", "g-old", "g")],
  });
  return { atlas: makeAtlasBundle(docs), graph, sVault, sVault2, sOwner, sOwner2, gOwner, gOldOwner };
}

describe("findCousinDocs — multi-instance primitives", () => {
  it("matches a nested doc by title within same-venue instances, own prime first, completed last", () => {
    const { atlas, graph, sOwner, sOwner2, gOwner, gOldOwner } = venueFixture();
    // Not Spark's Aave market (another venue), and not Grove's suffix-aligned "Allocator Role Addresses".
    expect(findCousinDocs(sOwner.id, atlas, graph)).toEqual([
      { node: sOwner2, agent: "Spark" },
      { node: gOwner, agent: "Grove" },
      { node: gOldOwner, agent: "Grove", completed: true },
    ]);
  });

  it("matches an ICD root to the other ICDs at its venue", () => {
    const { atlas, graph, sVault, sVault2 } = venueFixture();
    expect(findCousinDocs(sVault.id, atlas, graph).map((c) => c.node.id)).toEqual([sVault2.id, "g-v1", "g-old"]);
  });

  it("files a regrouped ICD narrowly: an unrecognised filing matches by instance name only", () => {
    const { atlas, graph, sOwner } = venueFixture();
    // The Morpho heading disappears: Spark's vault now sits straight under a chain heading.
    atlas.docs["s-morpho"] = { ...atlas.docs["s-morpho"], title: "Ethereum Mainnet" };
    atlas.docs["s-eth"] = { ...atlas.docs["s-eth"], title: "Active Instances" };
    expect(findCousinDocs(sOwner.id, atlas, graph)).toEqual([]);
  });

  it("pairs ICD Location entries through the ICDs they point at", () => {
    const { atlas, graph } = venueFixture();
    const loc = (id: string, doc_no: string, icd: string) => {
      const n = makeNode({ id, doc_no, title: `${atlas.docs[icd].title} Location`, content: `Located at [ICD](${icd}).` });
      atlas.docs[id] = n;
      atlas.docNoToId.set(doc_no, id);
      return n;
    };
    const sLoc = loc("s-loc1", "A.6.1.1.1.2.6.1.1.2.1.3.1", "s-v1");
    const sLoc2 = loc("s-loc2", "A.6.1.1.1.2.6.1.1.2.1.3.2", "s-v2");
    loc("s-loc-aave", "A.6.1.1.1.2.6.1.1.2.1.5.1", "s-aave1");
    const gLoc = loc("g-loc1", "A.6.1.1.2.2.6.1.1.2.1.7.1", "g-v1");
    // Spark's other Morpho entry and Grove's Morpho entry; not Spark's Aave entry, and none for g-old (no entry).
    expect(findCousinDocs(sLoc.id, atlas, graph).map((c) => c.node.id)).toEqual([sLoc2.id, gLoc.id]);
  });

  it("treats a directory entry titled without 'Location' as an entry", () => {
    const { atlas, graph } = venueFixture();
    const add = (id: string, doc_no: string, title: string, content = "") => {
      const n = makeNode({ id, doc_no, title, content });
      atlas.docs[id] = n;
      atlas.docNoToId.set(doc_no, id);
      return n;
    };
    add("s-dir", "A.6.1.1.1.2.6.1.1.2", "Active Instances Directory");
    add("g-dir", "A.6.1.1.2.2.6.1.1.2", "Active Instances Directory");
    const sEntry = add("s-e1", "A.6.1.1.1.2.6.1.1.2.1", "Morpho USDC Instance Configuration Document", "Located at [ICD](s-v1).");
    const gEntry = add("g-e1", "A.6.1.1.2.2.6.1.1.2.1", "Steakhouse USDC Morpho Instance Configuration Document Location", "Located at [ICD](g-v1).");
    expect(findCousinDocs(sEntry.id, atlas, graph).map((c) => c.node.id)).toEqual([gEntry.id]);
  });

  it(`caps the list at ${MAX_COUSINS}`, () => {
    const { atlas, graph, sVault } = venueFixture();
    for (let i = 10; i < 40; i++) {
      const n = makeNode({ id: `g-x${i}`, doc_no: `A.6.1.1.2.2.6.1.3.1.7.${i}`, title: `Vault ${i} Instance Configuration Document` });
      atlas.docs[n.id] = n;
      atlas.docNoToId.set(n.doc_no, n.id);
      graph.instances.push(makeGraphEntity({ id: `ix${i}`, name: `x${i}`, st: "allocation-system", did: n.id, m: JSON.stringify({ agent_doc_id: "g" }) }));
    }
    expect(findCousinDocs(sVault.id, atlas, graph)).toHaveLength(MAX_COUSINS);
  });
});

// Distribution Reward style: ICDs filed straight under a status heading, one per integrator.
describe("findCousinDocs — instances filed under a status heading", () => {
  function directFixture() {
    const n = (id: string, doc_no: string, title: string) => makeNode({ id, doc_no, title });
    const docs = [
      n("k", "A.6.1.1.3", "Keel"), n("b", "A.6.1.1.4", "Skybase"),
      n("k-act", "A.6.1.1.3.2.5.1.2", "Active Instances"), n("b-act", "A.6.1.1.4.2.5.1.2", "Active Instances"),
      n("k-1inch", "A.6.1.1.3.2.5.1.2.1", "1inch Instance Configuration Document"),
      n("k-bridge", "A.6.1.1.3.2.5.1.2.2", "Solana Bridge Instance Configuration Document"),
      n("b-1inch", "A.6.1.1.4.2.5.1.2.1", "1inch Instance Configuration Document"),
      n("b-cow", "A.6.1.1.4.2.5.1.2.2", "CoW Swap Instance Configuration Document"),
    ];
    const inst = (id: string, name: string, did: string, agent: string) =>
      makeGraphEntity({ id, name, st: "distribution-reward", did, m: JSON.stringify({ agent_doc_id: agent }) });
    const graph = makeGraphData({
      participants: [
        makeGraphEntity({ id: "k", name: "Keel", et: "agent", st: "prime", did: "k" }),
        makeGraphEntity({ id: "b", name: "Skybase", et: "agent", st: "prime", did: "b" }),
      ],
      instances: [inst("1", "1inch", "k-1inch", "k"), inst("2", "Solana Bridge", "k-bridge", "k"), inst("3", "1inch", "b-1inch", "b"), inst("4", "CoW Swap", "b-cow", "b")],
    });
    return { atlas: makeAtlasBundle(docs), graph };
  }

  it("links the prime's own siblings and other primes' same-named instance, but not their other instances", () => {
    const { atlas, graph } = directFixture();
    // Skybase's 1inch shares the name, so it outranks Keel's own differently named sibling.
    expect(findCousinDocs("k-1inch", atlas, graph).map((c) => c.node.id)).toEqual(["b-1inch", "k-bridge"]);
    expect(findCousinDocs("b-cow", atlas, graph).map((c) => c.node.id)).toEqual(["b-1inch"]);
  });
});

// The artifact skeleton around the primitives has no covering entity; its
// counterpart is the doc at the same place under each other prime, same title.
describe("findCousinDocs — artifact skeleton", () => {
  function skeletonFixture() {
    const n = (id: string, doc_no: string, title: string) => makeNode({ id, doc_no, title });
    const docs = [
      n("s", "A.6.1.1.1", "Spark"), n("g", "A.6.1.1.2", "Grove"), n("k", "A.6.1.1.3", "Keel"),
      n("s-intro", "A.6.1.1.1.1", "Introduction"), n("g-intro", "A.6.1.1.2.1", "Introduction"), n("k-intro", "A.6.1.1.3.1", "Overview"),
      n("s-gen", "A.6.1.1.1.2.1", "Genesis Primitives"), n("g-gen", "A.6.1.1.2.2.1", "Genesis Primitives"), n("k-gen", "A.6.1.1.3.2.1", "Genesis Primitives"),
      n("s-omni", "A.6.1.1.1.3.1", "Parameters"), n("g-omni", "A.6.1.1.2.3.1", "Parameters"),
    ];
    const graph = makeGraphData({
      participants: [
        makeGraphEntity({ id: "s", name: "Spark", et: "agent", st: "prime", did: "s" }),
        makeGraphEntity({ id: "g", name: "Grove", et: "agent", st: "prime", did: "g" }),
        makeGraphEntity({ id: "k", name: "Keel", et: "agent", st: "prime", did: "k" }),
      ],
    });
    return { atlas: makeAtlasBundle(docs), graph };
  }

  it("pairs the same skeleton doc across primes, by position and title", () => {
    const { atlas, graph } = skeletonFixture();
    expect(findCousinDocs("s-gen", atlas, graph).map((c) => [c.node.id, c.agent])).toEqual([["g-gen", "Grove"], ["k-gen", "Keel"]]);
    // Keel's doc at that place is titled differently, so it is not a counterpart.
    expect(findCousinDocs("s-intro", atlas, graph).map((c) => c.node.id)).toEqual(["g-intro"]);
  });

  it("pairs the artifact roots, whose titles are the agents' names", () => {
    const { atlas, graph } = skeletonFixture();
    expect(findCousinDocs("s", atlas, graph).map((c) => c.node.id)).toEqual(["g", "k"]);
  });

  it("leaves omni docs to the omni path", () => {
    const { atlas, graph } = skeletonFixture();
    // A generic omni title fails the omni share guard and must not fall back to position.
    for (let i = 0; i < 4; i++) {
      const o = makeNode({ id: `o${i}`, doc_no: `A.2.${i}`, title: "Parameters" });
      atlas.docs[o.id] = o;
      atlas.docNoToId.set(o.doc_no, o.id);
    }
    expect(findCousinDocs("s-omni", atlas, graph)).toEqual([]);
  });
});

describe("findCousinDocs — primitive-level docs", () => {
  it("never pairs a primitive-level doc with a doc inside another prime's ICD", () => {
    const n = (id: string, doc_no: string, title: string) => makeNode({ id, doc_no, title });
    const docs = [
      n("s", "A.6.1.1.1", "Spark"), n("g", "A.6.1.1.2", "Grove"),
      n("s-prim", "A.6.1.1.1.2.6.1", "Allocation System Primitive"), n("g-prim", "A.6.1.1.2.2.6.1", "Allocation System Primitive"),
      n("s-proc", "A.6.1.1.1.2.6.1.2.4", "Cooldown sUSDe Shares"),
      n("g-icd", "A.6.1.1.2.2.6.1.3.1", "Ethena sUSDe Instance Configuration Document"),
      n("g-icd-step", "A.6.1.1.2.2.6.1.3.1.3.2", "Cool Down sUSDe Shares"),
      n("s-hub", "A.6.1.1.1.2.6.1.1.1", "Global Activation Status"), n("g-hub", "A.6.1.1.2.2.6.1.1.1", "Global Activation Status"),
    ];
    const prim = (id: string, did: string, agent: string) =>
      makeGraphEntity({ id, et: "primitive", st: "allocation-system", did, m: JSON.stringify({ agent_doc_id: agent }) });
    const graph = makeGraphData({
      participants: [
        makeGraphEntity({ id: "s", name: "Spark", et: "agent", st: "prime", did: "s" }),
        makeGraphEntity({ id: "g", name: "Grove", et: "agent", st: "prime", did: "g" }),
      ],
      primitives: [prim("p-s", "s-prim", "s"), prim("p-g", "g-prim", "g")],
    });
    const atlas = makeAtlasBundle(docs);
    expect(findCousinDocs("s-proc", atlas, graph)).toEqual([]);
    expect(findCousinDocs("s-hub", atlas, graph).map((c) => c.node.id)).toEqual(["g-hub"]);
  });
});
