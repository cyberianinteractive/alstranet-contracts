// deploy/01_tokens/01_base_governance_token.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployBaseGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const {
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader
    } = await getNamedAccounts();

    console.log("Deploying BaseGovernanceToken with deployer:", deployer);

    // Deploy the implementation and proxy
    const result = await deploy('BaseGovernanceToken', {
        from: deployer,
        contract: 'BaseGovernanceToken',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: '__BaseGovernanceToken_init',
                args: [
                    "Base Governance Token",
                    "BGT",
                    defaultAdmin,
                    pauser,
                    minter,
                    upgrader
                ],
            },
        },
        log: true,
    });

    if (result.newlyDeployed) {
        console.log("BaseGovernanceToken deployed at:", result.address);
    }
};

deployBaseGovernanceToken.tags = ['BaseGovernanceToken', 'tokens'];
export default deployBaseGovernanceToken;