const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "terms.html"), "utf8");

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/Â°C/g, " degrees C")
    .replace(/Ã§/g, "c")
    .replace(/[\u00A0\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function aliasesFor(term) {
  const aliases = new Set();
  const matches = term.match(/\(([^)]+)\)/g) || [];

  matches.forEach((match) => {
    const value = match.slice(1, -1).trim();
    if (value.length > 1) aliases.add(value);
  });

  const acronym = term.match(/^([A-Z0-9&]{2,})(?:\s|\()/);
  if (acronym) aliases.add(acronym[1]);

  const plain = term.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (plain && plain !== term) aliases.add(plain);

  return [...aliases].filter((alias) => alias.toLowerCase() !== term.toLowerCase());
}

function categoryFor(term, definition) {
  const haystack = `${term} ${definition}`.toLowerCase();

  if (/\b(jct|nec|fidic|contract|adjudication|arbitration|clause|novation|damages|eot|loi|retention|bond|privity|condition precedent|letter of intent)\b/.test(haystack)) return "Contracts";
  if (/\b(cvr|valuation|payment|cost|cash flow|account|tender|boq|bill of quantities|commercial|final account|defined cost|disallowed cost|target cost|open book|contra|cis)\b/.test(haystack)) return "Commercial";
  if (/\b(nrm|smm|measurement|gifa|area|quantity|take[- ]?off|cessm|floor area)\b/.test(haystack)) return "Measurement";
  if (/\b(bim|iso 19650|cde|cobie|clash|model|digital|scada|mmc|modern methods)\b/.test(haystack)) return "Construction Tech";
  if (/\b(hvac|m&e|mechanical|electrical|ductwork|sprinkler|fire alarm|voltage|lthw|chw|fcu|mcc|switchgear|underfloor heating|cable)\b/.test(haystack)) return "M&E";
  if (/\b(law|legal|liability|insurance|regulations|riddor|cdm|coshh|puwer|hse|agreement|act 1996|water industry|planning)\b/.test(haystack)) return "Legal";
  if (/\b(excavation|ground|piling|soil|geotextile|shoring|dewatering|bentonite|subgrade|cbr|heave|earthworks|foundation)\b/.test(haystack)) return "Groundworks";
  if (/^[A-Z0-9&]{2,}\b/.test(term) || /\([A-Z0-9&]{2,}\)/.test(term)) return "Acronyms";

  return "Construction";
}

const cardPattern = /<div class="term-card">[\s\S]*?<h3 class="term">([\s\S]*?)<\/h3>[\s\S]*?<p class="definition">([\s\S]*?)<\/p>[\s\S]*?<\/div>/g;
const records = [];
const seen = new Map();
let match;

while ((match = cardPattern.exec(source))) {
  const term = decodeEntities(match[1].replace(/<[^>]*>/g, ""));
  const definition = decodeEntities(match[2].replace(/<[^>]*>/g, ""));
  const key = term.toLowerCase();

  if (!term || !definition || seen.has(key)) continue;

  const record = {
    id: slugify(term),
    term,
    definition,
    category: categoryFor(term, definition),
    aliases: aliasesFor(term),
    relatedTerms: []
  };

  seen.set(key, record);
  records.push(record);
}

records.sort((a, b) => a.term.localeCompare(b.term, "en-GB"));

fs.writeFileSync(
  path.join(root, "terms.json"),
  `${JSON.stringify(records, null, 2)}\n`,
  "utf8"
);

console.log(`Wrote ${records.length} terms to terms.json`);
