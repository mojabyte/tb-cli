import fsPromise from 'fs/promises';
import path from 'path';

import { getRuleChainMetadata, getRuleChains } from '../../services';
import { RuleChain } from '../../types';

const backupRuleChain = async (ruleChain: RuleChain, tenantDir: string) => {
  const { data: ruleChainData } = await getRuleChainMetadata(ruleChain.id.id);
  const ruleChainBackupData = {
    ruleChain: ruleChain,
    metadata: ruleChainData,
  };

  await fsPromise.writeFile(
    path.join(tenantDir, 'ruleChains', `${ruleChain.name}.json`),
    JSON.stringify(ruleChainBackupData, undefined, 2)
  );
};

export const backupRuleChains = async (tenantDir: string) => {
  console.log('Backup Rule Chains...');

  try {
    let page = 0;
    let hasNext = true;
    let totalElements = 0;

    while (hasNext) {
      const { data } = await getRuleChains({ page, pageSize: 100 });
      const ruleChains = data.data;
      hasNext = data.hasNext;
      totalElements = data.totalElements;

      await Promise.all(ruleChains.map(ruleChain => backupRuleChain(ruleChain, tenantDir)));

      page += 1;
    }

    console.log(`Successfully backed up ${totalElements} Rule Chains!`);
  } catch (e) {
    console.log(e);
  }
};
