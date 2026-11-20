// Command-line flag parsing shared by the eval scripts.
export const argv = process.argv.slice(2);

/** Every value given for a repeatable `--name value` flag. */
export const flag = (name: string) => argv.flatMap((a, i) => (a === `--${name}` && argv[i + 1] ? [argv[i + 1]] : []));
