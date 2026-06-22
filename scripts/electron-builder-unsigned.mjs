#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const appleSigningEnvKeys = [
  "APPLE_ID",
  "APPLE_APP_SPECIFIC_PASSWORD",
  "APPLE_TEAM_ID",
  "APPLE_API_KEY",
  "APPLE_API_KEY_ID",
  "APPLE_API_ISSUER",
  "APPLE_KEYCHAIN",
  "APPLE_KEYCHAIN_PROFILE",
];

export const codeSigningEnvKeys = [
  "CSC_LINK",
  "CSC_KEY_PASSWORD",
  "CSC_NAME",
  "WIN_CSC_LINK",
  "WIN_CSC_KEY_PASSWORD",
];

const unsignedElectronBuilderBaseArgs = [
  "exec",
  "electron-builder",
  "--config",
  "electron-builder.yml",
  "--publish",
  "never",
  "-c.mac.hardenedRuntime=false",
];

export const unsignedElectronBuilderArgs = (extraArgs = []) => [
  ...unsignedElectronBuilderBaseArgs,
  ...extraArgs,
];

export const unsignedBuildEnv = (baseEnv = process.env) => {
  const env = {
    ...baseEnv,
    CSC_IDENTITY_AUTO_DISCOVERY: "false",
  };

  for (const key of [...appleSigningEnvKeys, ...codeSigningEnvKeys]) {
    delete env[key];
  }

  return env;
};

export const runUnsignedElectronBuilder = ({
  cwd = process.cwd(),
  env = process.env,
  extraArgs = process.argv.slice(2),
} = {}) => {
  const result = spawnSync("pnpm", unsignedElectronBuilderArgs(extraArgs), {
    cwd,
    env: unsignedBuildEnv(env),
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

const isEntrypoint =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  process.exitCode = runUnsignedElectronBuilder();
}
