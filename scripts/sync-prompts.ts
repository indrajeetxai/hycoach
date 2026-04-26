import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROMPTS_DIR = "prompts";
const OUTPUT_FILE = "convex/_prompts.ts";

function toConst(name: string): string {
  return name
    .replace(/[/\-]/g, "_")
    .replace(/\.md$/, "")
    .toUpperCase();
}

function walk(dir: string, prefix = ""): { name: string; content: string }[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const result: { name: string; content: string }[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      result.push(...walk(full, rel));
    } else if (entry.name.endsWith(".md") && entry.name !== "prompt-composition.md") {
      result.push({ name: rel, content: readFileSync(full, "utf-8") });
    }
  }
  return result;
}

const prompts = walk(PROMPTS_DIR);
const lines = [
  "// AUTO-GENERATED. Do not edit. Run `npm run sync-prompts`.",
  "// Source: prompts/*.md",
  "",
];
for (const p of prompts) {
  const constName = toConst(p.name);
  const escaped = p.content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
  lines.push(`export const ${constName} = \`${escaped}\`;`);
  lines.push("");
}
writeFileSync(OUTPUT_FILE, lines.join("\n"));
console.log(`Synced ${prompts.length} prompts to ${OUTPUT_FILE}`);
