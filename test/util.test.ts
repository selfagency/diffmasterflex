import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock @actions/core to observe outputs
vi.mock('@actions/core', () => ({
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  warning: vi.fn(),
  debug: vi.fn()
}));

// mock child_process.spawn so we can simulate command output
vi.mock('child_process', () => ({
  spawn: vi.fn((command: string, args: string[]) => {
    // simple fake child process with stdout/stderr streams and event handlers
    const stdout = { on: (ev: string, cb: Function) => { if (ev === 'data') cb(Buffer.from('out-line\n')); } };
    const stderr = { on: (ev: string, cb: Function) => { if (ev === 'data') cb(Buffer.from('err-line\n')); } };
    return {
      stdout,
      stderr,
      on: (ev: string, cb: Function) => {
        if (ev === 'close') cb(0);
      }
    } as any;
  })
}));

import * as core from '@actions/core';
import { errorOut, run } from '../src/util.js';

describe('util.run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('collects stdout/stderr and returns trimmed output', async () => {
    const out = await run('echo', ['hello']);
    expect(out).toBe('out-line\nerr-line');
  });

  it('returns empty string on exec rejection', async () => {
    const { spawn } = await import('child_process');
    // make spawn throw for this test
    (spawn as any).mockImplementationOnce(() => { throw new Error('boom'); });
    const out = await run('badcmd', ['--fail']);
    expect(out).toBe('');
  });
});

describe('util.errorOut', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls core.warning when message contains warn', () => {
    errorOut('this is a WARNing');
    expect(core.warning).toHaveBeenCalled();
  });

  it('calls core.debug for normal messages', () => {
    errorOut('an ordinary message');
    expect(core.debug).toHaveBeenCalled();
  });
});
