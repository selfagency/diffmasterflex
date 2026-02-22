import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock @actions/core to observe outputs
vi.mock('@actions/core', () => ({
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  warning: vi.fn(),
  debug: vi.fn()
}));

// mock @actions/exec so we can simulate command output
vi.mock('@actions/exec', () => ({
  exec: vi.fn(async (command: string, args: string[], opts: any) => {
    // simulate listeners writing to stdout/stderr
    const listeners = opts?.listeners || {};
    if (listeners.stdout) listeners.stdout(Buffer.from('out-line\n'));
    if (listeners.stderr) listeners.stderr(Buffer.from('err-line\n'));
    return Promise.resolve(0);
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
    const { exec } = await import('@actions/exec');
    // make exec throw for this test
    (exec as any).mockImplementationOnce(async () => { throw new Error('boom'); });
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
