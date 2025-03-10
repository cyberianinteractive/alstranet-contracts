// deploy/01_tokens/00_alstra.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployAlstraToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { 
    deployer, 
    defaultAdmin, 
    pauser, 
    minter, 
    upgrader,
    feeManager,
    vestingManager,
    stakingManager 
  } = await getNamedAccounts();

  console.log("Deploying AlstraToken with deployer:", deployer);

  // Deploy the implementation and proxy
  const result = await deploy('AlstraToken', {
    from: deployer,
    contract: 'AlstraToken',
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [
          defaultAdmin, 
          pauser, 
          minter, 
          upgrader,
          feeManager,
          vestingManager,
          stakingManager
        ],
      },
    },
    log: true,
  });

  if (result.newlyDeployed) {
    console.log("AlstraToken deployed at:", result.address);
    console.log("Initialization parameters:");
    console.log(" - Default Admin:", defaultAdmin);
    console.log(" - Pauser:", pauser);
    console.log(" - Minter:", minter);
    console.log(" - Upgrader:", upgrader);
    console.log(" - Fee Manager:", feeManager);
    console.log(" - Vesting Manager:", vestingManager);
    console.log(" - Staking Manager:", stakingManager);
  }
};

deployAlstraToken.tags = ['AlstraToken', 'tokens'];
export default deployAlstraToken;