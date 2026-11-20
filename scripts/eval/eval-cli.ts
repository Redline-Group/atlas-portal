// Command-line and concurrency helpers shared by the chat bakeoffs.
export const argv = process.argv.slice(2);

/** Every value given for a repeatable `--name value` flag. */
export const flag = (name: string) => argv.flatMap((a, i) => (a === `--${name}` && argv[i + 1] ? [argv[i + 1]] : []));

/** Runs `task` over indexes 0..count-1 on `concurrency` workers. Each worker
 *  takes the next unclaimed index, so tasks start in index order. */
export async function runPool(count: number, concurrency: number, task: (i: number) => Promise<void>): Promise<void> {
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor++;
      if (i >= count) return;
      await task(i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
}
