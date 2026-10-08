import { resolve } from "node:path";

import { validateJsonlFile } from "./jsonl.js";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const positional = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const file = resolve(valueAfter("--file") ?? positional ?? "snapshots.jsonl");
console.log(JSON.stringify(await validateJsonlFile(file), null, 2));
