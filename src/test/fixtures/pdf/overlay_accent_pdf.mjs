/**
 * Minimal PDF whose text layer models TeX/OT1-style overlay accents:
 * Helvetica Type1 + WinAnsiEncoding Differences [207 /caron 232 /ccaron],
 * "s" then a separate /caron glyph (optionally overlaid), then " ka " and /ccaron.
 *
 * Usage:
 *   node src/test/fixtures/pdf/overlay_accent_pdf.mjs
 *   node src/test/fixtures/pdf/overlay_accent_pdf.mjs --write /tmp/overlay-accent.pdf
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../..");

const CARON = String.fromCharCode(207);
const CCARON = String.fromCharCode(232);

function buildOverlayAccentPdf() {
  // Helvetica widths at 12pt: P=8.664, l=i=space=3.336, s=6.672.
  // "Pli " ends at 72+18.672=90.672, which is the origin of "s".
  // Tm places /caron on that same origin; Td would move the line matrix
  // instead of the glyph position advanced by Tj.
  const stream =
    "BT\n" +
    "/F1 12 Tf\n" +
    "1 0 0 1 72 50 Tm\n" +
    "(Pli ) Tj\n" +
    "1 0 0 1 90.672 50 Tm\n" +
    "(s) Tj\n" +
    "1 0 0 1 90.672 50 Tm\n" +
    `(${CARON}) Tj\n` +
    "1 0 0 1 97.344 50 Tm\n" +
    `( ka ${CCARON}) Tj\n` +
    "ET\n";

  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };

  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  add(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 120] /Contents 4 0 R " +
      "/Resources << /Font << /F1 5 0 R >> >> >>"
  );
  add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream`);
  add(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica " +
      "/Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding " +
      "/Differences [207 /caron 232 /ccaron] >> >>"
  );

  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const chunks = ["%PDF-1.4\n"];
  objects.forEach((body, i) => {
    const obj = `${i + 1} 0 obj\n${body}\nendobj\n`;
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    chunks.push(obj);
    offset += Buffer.byteLength(obj, "latin1");
  });
  const startxref = offset;
  chunks.push(`xref\n0 ${objects.length + 1}\n${xref.join("\n")}\n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`);
  chunks.push(`startxref\n${startxref}\n%%EOF\n`);
  return Buffer.from(chunks.join(""), "latin1");
}

function codePoints(str) {
  return Array.from(str)
    .map((ch) => "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
    .join(" ");
}

async function extractWithPdfjs(pdfBytes) {
  const pdfjsPath = join(repoRoot, "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const workerPath = join(repoRoot, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  const pdfjs = await import(pathToFileURL(pdfjsPath).href);
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    disableWorker: true,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const withNorm = await page.getTextContent({ disableNormalization: false });
  const noNorm = await page.getTextContent({ disableNormalization: true });
  const itemsOf = (tc) =>
    tc.items.map((it) => ({
      str: it.str,
      x: it.transform?.[4],
      y: it.transform?.[5],
      width: it.width,
    }));
  return {
    version: pdfjs.version,
    disableNormalizationFalse: itemsOf(withNorm),
    disableNormalizationTrue: itemsOf(noNorm),
    normalizeUnicode: typeof pdfjs.normalizeUnicode,
  };
}

const writeIdx = process.argv.indexOf("--write");
const pdfBytes = buildOverlayAccentPdf();
if (writeIdx >= 0) {
  const out = process.argv[writeIdx + 1];
  writeFileSync(out, pdfBytes);
  console.log(`wrote ${out} (${pdfBytes.length} bytes)`);
}

const extracted = await extractWithPdfjs(pdfBytes);
const items = extracted.disableNormalizationTrue;
const joined = items.map((it) => it.str).join("");
const nfc = joined.normalize("NFC");
const nfkc = joined.normalize("NFKC");
const sItem = items.find((it) => it.str.includes("s"));
const caronItem = items.find((it) => it.str.includes("\u02C7"));

console.log(JSON.stringify({
  pdfjsVersion: extracted.version,
  itemsNoNorm: items,
  itemsNoNormCodes: items.map((it) => codePoints(it.str)),
  itemsWithNorm: extracted.disableNormalizationFalse,
  joined,
  joinedCodes: codePoints(joined),
  nfcEqualsJoined: nfc === joined,
  nfkcEqualsJoined: nfkc === joined,
  hasSThenSpacingCaron: joined.includes("s\u02C7"),
  nfcStillHasSpacingCaron: nfc.includes("s\u02C7"),
  caronOverlaysS: sItem != null && caronItem != null &&
    caronItem.x >= sItem.x && caronItem.x < sItem.x + sItem.width,
  sItem,
  caronItem,
}, null, 2));
