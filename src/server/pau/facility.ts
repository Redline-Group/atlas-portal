// An NFAT Facility Contract's own state, read live: the asset it takes (and
// that asset's symbol, in a second read once the gem is known), where
// issued principal goes, whether it is stopped, and whether the deployment's
// ALM proxy is one of its operators (the only accounts that may issue). It has
// no admin events in the catalogue, so its history is never "unread".
import { membersOf, type PauDeployment, type PauMember } from "../../lib/pauRegistry.ts";
import type { ContractState } from "../../lib/pau.ts";
import type { ChainCall, ChainReader } from "./snapshot.ts";

const address = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : null);
const text = (v: unknown) => (typeof v === "string" ? v : null);

/** The facility as a snapshot contract; a read that fails is null. */
export async function facilityContract(read: ChainReader, d: PauDeployment, m: PauMember): Promise<ContractState> {
  const proxy = membersOf(d, "almProxy")[0]?.address;
  const call = (functionName: ChainCall["functionName"], args: readonly unknown[] = []): ChainCall => ({ address: m.address, functionName, args });
  const calls = [call("gem"), call("recipient"), call("stopped"), call("name"), call("symbol"), ...(proxy ? [call("buds", [proxy])] : [])];
  const [gem, recipient, stopped, name, symbol, bud] = await read(d.chain, calls);
  const asset = address(gem);
  const [gemSymbol] = asset ? await read(d.chain, [{ address: asset, functionName: "symbol", args: [] }]) : [null];
  const facility = {
    gem: asset,
    gemSymbol: text(gemSymbol),
    recipient: address(recipient),
    stopped: typeof stopped === "boolean" ? stopped : null,
    operator: typeof bud === "bigint" ? bud === 1n : null,
    name: text(name),
    symbol: text(symbol),
  };
  return { role: m.role, address: m.address, events: 0, historyComplete: true, facility };
}
