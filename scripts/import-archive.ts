// scripts/import-archive.ts - extracts a single entry from a ZIP archive
// without external dependencies (Node zlib + a minimal local-file-header
// parser). Only supports the common ZIP shapes: local file headers, deflate or
// stored entries, and no Zip64/data-descriptor edge cases beyond what a
// standard Kaggle/CSV export produces. Throws loudly otherwise.
//
// Used by scripts/import-datasets.ts for sources that ship a zip (Kaggle).

import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const isZip = (b: Buffer): boolean => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

export const extractArchiveEntry = (zipPath: string, entryName: string): string => {
  const buf = readFileSync(zipPath);
  if (!isZip(buf)) {
    throw new Error(`not a zip archive: ${zipPath}`);
  }

  // Walk local file headers (signature PK\x03\x04).
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break; // not a local header
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    if (name === entryName) {
      const data = buf.subarray(dataStart, dataStart + compSize);
      const raw = method === 0 ? data : method === 8 ? inflateRawSync(data) : null;
      if (raw === null) {
        throw new Error(`unsupported zip compression method ${method} for ${entryName}`);
      }
      return raw.toString("utf8");
    }
    offset = dataStart + compSize;
  }

  throw new Error(`entry "${entryName}" not found in ${zipPath}`);
};
