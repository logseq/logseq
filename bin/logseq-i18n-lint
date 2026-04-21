#!/usr/bin/env bash
# logseq-i18n-lint launcher
# Detects the current OS/arch and runs the prebuilt binary in the same directory.
# All arguments are forwarded to the binary.
#
# Supported platforms:
#   Linux   x86_64  -> logseq-i18n-lint-x86_64-linux
#   Linux   aarch64 -> logseq-i18n-lint-aarch64-linux
#   macOS   x86_64  -> logseq-i18n-lint-x86_64-macos
#   macOS   arm64   -> logseq-i18n-lint-aarch64-macos
#   Windows x86_64  -> logseq-i18n-lint-x86_64-windows.exe  (via Git Bash / MSYS2)
#   Windows aarch64 -> logseq-i18n-lint-aarch64-windows.exe

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Detect OS ────────────────────────────────────────────────────────────────

OS="$(uname -s)"
case "${OS}" in
    Linux*)   platform="linux" ;;
    Darwin*)  platform="macos" ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
              platform="windows" ;;
    *)
        echo "error: unsupported OS: ${OS}" >&2
        exit 1
        ;;
esac

# ── Detect architecture ───────────────────────────────────────────────────────

ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64|amd64)   arch="x86_64" ;;
    aarch64|arm64)  arch="aarch64" ;;
    *)
        echo "error: unsupported architecture: ${ARCH}" >&2
        exit 1
        ;;
esac

# ── Resolve binary path ────────────────────────────────────────────────────────

if [[ "${platform}" == "windows" ]]; then
    bin="${SCRIPT_DIR}/logseq-i18n-lint-${arch}-${platform}.exe"
else
    bin="${SCRIPT_DIR}/logseq-i18n-lint-${arch}-${platform}"
fi

if [[ ! -f "${bin}" ]]; then
    echo "error: binary not found: ${bin}" >&2
    echo "  Download it from: https://github.com/logseq/logseq-i18n-lint/releases/latest" >&2
    exit 1
fi

if [[ ! -x "${bin}" ]]; then
    chmod +x "${bin}"
fi

# ── Run ───────────────────────────────────────────────────────────────────────

exec "${bin}" "$@"
