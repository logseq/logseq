#!/usr/bin/env python3
"""Author a private, original PDF fixture; never read application documents."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

MARKER = "Original page one"


def authored_pdf():
    # The same original two-page content as the macOS PDF qualification example.
    def stream(text):
        content = f"BT /F1 18 Tf 72 700 Td ({text}) Tj ET\n".encode("ascii")
        return f"<< /Length {len(content)} >>\nstream\n".encode("ascii") + content + b"endstream"

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>",
        stream(MARKER),
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Rotate 90 /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>",
        stream("Rotated page two"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, value in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii") + value + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010} 00000 n \n".encode("ascii"))
    pdf.extend((f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\n"
                f"startxref\n{xref}\n%%EOF\n").encode("ascii"))
    return bytes(pdf)


def prepare(output):
    output = Path(output)
    if not output.is_absolute() or output.exists() or output.is_symlink():
        raise ValueError("PDF probe output must be a new absolute directory")
    payload = authored_pdf()
    receipt = {
        "schema": 1,
        "fixture": "private-authored-two-page-pdf",
        "file": "original.pdf",
        "marker": MARKER,
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "authoredPages": 2,
        "qualification": "fixture-generation-only",
    }
    output.mkdir()
    try:
        (output / receipt["file"]).write_bytes(payload)
        (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    except BaseException:
        shutil.rmtree(output)
        raise
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(prepare(args.output), indent=2))


if __name__ == "__main__":
    main()
