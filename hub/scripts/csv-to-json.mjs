import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "../../consolidated-action-items.csv");
const outPath = join(__dirname, "../src/data/action-items.json");

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

const raw = readFileSync(csvPath, "utf8").trim();
const [headerLine, ...rows] = raw.split("\n");
const headers = parseCsvLine(headerLine);

const items = rows.map((line) => {
  const values = parseCsvLine(line);
  return Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ""]));
});

writeFileSync(outPath, `${JSON.stringify(items, null, 2)}\n`);
console.log(`Wrote ${items.length} items to ${outPath}`);
