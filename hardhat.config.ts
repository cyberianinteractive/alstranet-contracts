// Import individual plugins instead of hardhat-toolbox
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

// Import hardhat-deploy and its ethers extension
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // first account in the mnemonic is the default deployer
    },
    defaultAdmin: {
      default: 0, // using first account as defaultAdmin too
    },
    pauser: {
      default: 1,
    },
    minter: {
      default: 2,
    },
    upgrader: {
      default: 3,
    },
    feeManager: {
      default: 4,
    },
    vestingManager: {
      default: 5,
    },
    stakingManager: {
      default: 6,
    },
  },
  networks: {
    hardhat: {
      saveDeployments: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      saveDeployments: true,
    },
    // Add other networks (testnet, mainnet) as needed
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
  paths: {
    deploy: "deploy",
    deployments: "deployments",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;