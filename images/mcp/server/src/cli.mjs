import { execFile } from "node:child_process";

const LOGSEQ_BIN = process.env.LOGSEQ_BIN ?? "logseq";
const MAX_BUFFER = 64 * 1024 * 1024;

export class CliError extends Error {
  constructor(message, { code, hint, args, exitCode, stderr } = {}) {
    super(message);
    this.name = "CliError";
    this.code = code ?? "cli-error";
    this.hint = hint;
    this.args = args;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }

  toJSON() {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}

const SECRET_FLAGS = ["--password", "--e2ee-password"];

function redactArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const secret = SECRET_FLAGS.find((flag) => arg === flag || arg.startsWith(`${flag}=`));
    if (!secret) {
      out.push(arg);
    } else if (arg === secret) {
      out.push(arg, "***");
      i += 1;
    } else {
      out.push(`${secret}=***`);
    }
  }
  return out;
}

function execLogseq(args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(
      LOGSEQ_BIN,
      args,
      { timeout: timeoutMs, maxBuffer: MAX_BUFFER, env: process.env },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error ? (typeof error.code === "number" ? error.code : 1) : 0,
          killed: Boolean(error?.killed),
          spawnError: error && typeof error.code === "string" ? error : null,
          stdout,
          stderr,
        });
      },
    );
  });
}

/**
 * Runs `logseq <args> --output json` and returns the `data` payload.
 * Throws CliError with the CLI error code when the command fails.
 */
export async function runLogseqJson(args, { timeoutMs = 120_000 } = {}) {
  const fullArgs = [...args, "--output", "json"];
  const result = await execLogseq(fullArgs, timeoutMs);
  const safeArgs = redactArgs(fullArgs);

  if (result.spawnError) {
    throw new CliError(`failed to run ${LOGSEQ_BIN}: ${result.spawnError.message}`, {
      code: "cli-spawn-failed",
      args: safeArgs,
    });
  }
  if (result.killed) {
    throw new CliError(`logseq ${safeArgs.join(" ")} timed out after ${timeoutMs}ms`, {
      code: "cli-timeout",
      args: safeArgs,
      stderr: result.stderr,
    });
  }

  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    throw new CliError(
      `logseq ${safeArgs.join(" ")} returned non-JSON output (exit ${result.exitCode}): ${
        (result.stdout || result.stderr).trim().slice(0, 2000)
      }`,
      { code: "cli-invalid-output", args: safeArgs, exitCode: result.exitCode, stderr: result.stderr },
    );
  }

  if (payload?.status === "ok") return payload.data ?? null;

  const error = payload?.error ?? {};
  throw new CliError(error.message ?? `logseq ${safeArgs.join(" ")} failed`, {
    code: error.code,
    hint: error.hint,
    args: safeArgs,
    exitCode: result.exitCode,
    stderr: result.stderr,
  });
}

/** Runs a command whose output is plain text (help, skill show). */
export async function runLogseqText(args, { timeoutMs = 30_000 } = {}) {
  const result = await execLogseq(args, timeoutMs);
  if (result.spawnError) {
    throw new CliError(`failed to run ${LOGSEQ_BIN}: ${result.spawnError.message}`, {
      code: "cli-spawn-failed",
    });
  }
  const text = [result.stdout, result.stderr].filter((s) => s && s.trim()).join("\n");
  if (result.exitCode !== 0 && !text) {
    throw new CliError(`logseq ${args.join(" ")} failed with exit ${result.exitCode}`, {
      exitCode: result.exitCode,
    });
  }
  return text;
}

/** Formats a list of strings as an EDN vector of strings. */
export function ednStringVector(values) {
  return `[${values.map((value) => JSON.stringify(String(value))).join(" ")}]`;
}
