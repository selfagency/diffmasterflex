import * as core from '@actions/core';
import { spawn } from 'child_process';

const errorOut = (data: string | Error, hideWarning = false) => {
  console.log(data);
  if (typeof data === 'object' && data?.message) data = data?.message;
  if (typeof data === 'string') {
    if (
      !data?.toLowerCase()?.includes('warn') &&
      !data?.startsWith('error Command failed') &&
      !data?.startsWith('Exit code') &&
      !data?.startsWith('Command:') &&
      !data?.startsWith('Arguments:') &&
      !data?.startsWith('Directory:') &&
      !data?.startsWith('Output:') &&
      !data?.startsWith("The process '/usr/local/bin/yarn' failed") &&
      !data?.trim().length
    ) {
      core.setOutput('error', data);
      core.setFailed(data);
    } else if (!hideWarning && data?.toLowerCase()?.includes('warn')) {
      core.warning(data);
    } else {
      core.debug(data);
    }
  }
};

const isSafeToken = (s: string) => /^[a-zA-Z0-9._/-]+$/.test(s);

const run = async (command: string, args: string[]) => {
  let output = '';

  // Basic validation to avoid shell-injection via command or args
  if (!isSafeToken(command)) {
    throw new Error(`Unsafe command detected: ${command}`);
  }
  for (const a of args) {
    if (typeof a !== 'string' || !isSafeToken(a)) {
      throw new Error(`Unsafe argument detected: ${a}`);
    }
  }

  try {
    // Use spawn to avoid running a shell; spawn does not use a shell by default
    const child = spawn(command, args, { shell: false });

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    const exitCode: number = await new Promise((resolve, reject) => {
      child.on('error', err => reject(err));
      child.on('close', code => resolve(code ?? 0));
    });

    if (exitCode !== 0) {
      // Mimic previous behavior: surface errors via errorOut
      errorOut(output, command === 'yarn');
    }

    return output.trim();
  } catch (error) {
    errorOut(<Error>error);
    return output.trim();
  }
};

export { errorOut, run };
