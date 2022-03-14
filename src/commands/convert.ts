import fs from 'fs';
import fsPromise from 'fs/promises';
import moment from 'moment';
import path from 'path';

const convert = async (input: string, output: string) => {
  const baseDir = output || './converts';
  const dir = `${baseDir}/${moment()
    .format('YY-MM-DD HH:mm:ss')
    .replace(/[^0-9]/g, '')}`;

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(`${dir}/ruleChains`);
  fs.mkdirSync(`${dir}/dashboards`);
  fs.mkdirSync(`${dir}/widgets`);

  // Convert Rule Chains
  fsPromise
    .readdir(`${input}/ruleChains`)
    .then(filenames => {
      filenames.forEach(filename => {
        fsPromise.readFile(`${input}/ruleChains/${filename}`, 'utf-8').then(content => {
          const ruleChain = JSON.parse(content);
          delete ruleChain.ruleChainId;
          ruleChain.nodes.forEach((_node: any, index: number) => {
            delete ruleChain.nodes[index].id;
            delete ruleChain.nodes[index].createdTime;
            delete ruleChain.nodes[index].ruleChainId;
          });
          const convertedRuleChain = {
            ruleChain: {
              additionalInfo: null,
              name: path.parse(filename).name,
              firstRuleNodeId: null,
              root: false,
              debugMode: false,
              configuration: null,
            },
            metadata: ruleChain,
          };
          fsPromise.writeFile(`${dir}/ruleChains/${filename}`, JSON.stringify(convertedRuleChain));
        });
      });
    })
    .catch(e => {
      throw e;
    });

  // Convert Dashboards
  fsPromise
    .readdir(`${input}/dashboards`)
    .then(filenames => {
      filenames.forEach(filename => {
        fsPromise.readFile(`${input}/dashboards/${filename}`, 'utf-8').then(content => {
          const dashboard = JSON.parse(content);
          delete dashboard.id;
          delete dashboard.createdTime;
          delete dashboard.tenantId;
          delete dashboard.assignedCustomers;
          fsPromise.writeFile(
            `${dir}/dashboards/${filename}`,
            JSON.stringify(dashboard, undefined, 2)
          );
        });
      });
    })
    .catch(e => {
      throw e;
    });
};

export default convert;
