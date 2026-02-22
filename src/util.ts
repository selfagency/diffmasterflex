import * as core from '@actions/core';
import { exec } from '@actions/exec';

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

const run = async (command: string, args: string[]) => {
  let output = '';

  try {
    await exec(command, args, {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          output += data.toString();
        },
        errline: (data: string) => {
          errorOut(data, command === 'yarn');
        }
      }
    });

    return output.trim();
  } catch (error) {
    errorOut(<Error>error);
    return output.trim();
  }
};

export { errorOut, run };

