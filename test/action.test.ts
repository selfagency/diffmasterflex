import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock @actions/core and import it for assertions
vi.mock('@actions/core', () => ({
  getInput: vi.fn((name: string) => {
    if (name === 'ref') return 'origin/main';
    if (name === 'sha') return 'COMMIT_SHA';
    return '';
  }),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  debug: vi.fn()
}));

import * as core from '@actions/core';

describe('action entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.GITHUB_SHA = '';
  });

  it('computes diff and sets outputs', async () => {
    // mock util.run for the action's imports
    const mockRun = vi.fn(async (command: string, args: string[]) => {
      const a = args.join(' ');
      if (a.startsWith('log')) return 'commit MAIN_SHA\n';
      if (a.startsWith('merge-base')) return 'BASE_SHA';
      if (a.startsWith('merge-tree')) {
        return [
          'some header',
          '  our AAA BBB fileA.txt',
          '  their CCC DDD fileB.txt',
          'done'
        ].join('\n');
      }
      return '';
    });


    // doMock is not hoisted, so set the mock before importing the action
    vi.doMock('../src/util.js', () => ({ run: mockRun }));

    // import the action which runs immediately
    await import('../src/action');

    // validate outputs
    expect(core.setOutput).toHaveBeenCalledWith('diff', expect.any(String));
    const calls = (core.setOutput as any).mock.calls;
    const diffCall = calls.find((c: any[]) => c[0] === 'diff');
    const changedCall = calls.find((c: any[]) => c[0] === 'changed');
    expect(changedCall[1]).toBe(true);
    // diff should contain the file names we returned
    expect(diffCall[1]).toContain('fileA.txt');
    expect(diffCall[1]).toContain('fileB.txt');
  });

  it('handles no changes (merge-tree without our/their lines)', async () => {
    const mockRun = vi.fn(async (command: string, args: string[]) => {
      const a = args.join(' ');
      if (a.startsWith('log')) return 'commit MAIN_SHA\n';
      if (a.startsWith('merge-base')) return 'BASE_SHA';
      if (a.startsWith('merge-tree')) {
        return ['header', 'no changes here', 'done'].join('\n');
      }
      return '';
    });

    vi.doMock('../src/util.js', () => ({ run: mockRun }));
    await import('../src/action');

    const calls = (core.setOutput as any).mock.calls;
    const diffCall = calls.find((c: any[]) => c[0] === 'diff');
    const changedCall = calls.find((c: any[]) => c[0] === 'changed');
    expect(diffCall[1]).toBe('');
    expect(changedCall[1]).toBe(false);
  });

  it('parses varied spacing and multiple entries', async () => {
    const mockRun = vi.fn(async (command: string, args: string[]) => {
      const a = args.join(' ');
      if (a.startsWith('log')) return 'commit MAIN_SHA\n';
      if (a.startsWith('merge-base')) return 'BASE_SHA';
      if (a.startsWith('merge-tree')) {
        // include tabs and multiple spaces; extraction uses regex to collapse whitespace
        return [
          'hdr',
          '  our   AAA   BBB   spaced-file.txt',
          '  their\tCCC DDD another-file.js',
          '  our    EEE    FFF    third.txt',
        ].join('\n');
      }
      return '';
    });

    vi.doMock('../src/util.js', () => ({ run: mockRun }));
    await import('../src/action');

    const calls = (core.setOutput as any).mock.calls;
    const diffCall = calls.find((c: any[]) => c[0] === 'diff');
    const changedCall = calls.find((c: any[]) => c[0] === 'changed');
    expect(changedCall[1]).toBe(true);
    // should have joined the filenames
    expect(diffCall[1]).toContain('spaced-file.txt');
    expect(diffCall[1]).toContain('another-file.js');
    expect(diffCall[1]).toContain('third.txt');
  });
});
