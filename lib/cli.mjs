// Tiny flag parser shared by the scripts. Every flag takes one value, which keeps the command
// forms in the README exact and refuses typos instead of guessing.
export function parseFlags(argv, required, optional = []) {
  const values = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      throw new Error(`unexpected argument: ${token}`);
    }
    const name = token.slice(2);
    const allowed = required.includes(name) || optional.includes(name);
    if (!allowed) {
      throw new Error(`unknown flag: ${token}`);
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`the flag ${token} needs a value`);
    }
    values[name] = value;
    i += 1;
  }
  for (const name of required) {
    if (values[name] === undefined) {
      throw new Error(`the flag --${name} is required`);
    }
  }
  return values;
}

export function failUsage(error, usage) {
  process.stderr.write(`${error}\n${usage}\n`);
  process.exit(2);
}
