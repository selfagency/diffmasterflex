import core from '@actions/core';
import { run } from './util';

const action = async () => {
  try {
    // get environment variables
    const { REF = 'origin/main', SHA, GITHUB_SHA } = process.env;

    let commit = '';

    // get the commit
    if (SHA) {
      commit = SHA;
    } else if (GITHUB_SHA) {
      commit = GITHUB_SHA;
    } else {
      commit = await run('git', ['rev-parse', 'HEAD']);
    }

    // get the HEAD of the main branch
    const main = (await run('git', ['log', REF])).split('\n')[0].split(' ')[1];
    // core.info(main);

    // diff step 1
    const base = await run('git', ['merge-base', main, commit]);
    // core.info(base);

    // diff step 2
    const tree = await run('git', ['merge-tree', base, main, commit]);
    // core.info(tree);

    // diff step 3
    const filters = /^ {2}our|^ {2}their/;

    const diff = tree
      .split('\n')
      .filter(line => filters.test(line))
      .map(line => line.replace(/\s+/g, ' ').split(' ')[4])
      .join(' ');

    core.info(diff);
    core.setOutput('diff', diff);
    core.setOutput('changed', diff.trim().length > 0);
  } catch (error) {
    core.setFailed((<Error>error).message);
  }
};

(async () => await action())();
