// deploy/01_tokens/00_base_erc20_token.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployBaseERC20Token: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const {
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader
    } = await getNamedAccounts();

    console.log("Deploying BaseERC20Token with deployer:", deployer);

    // Deploy the implementation and proxy
    const result = await deploy('BaseERC20Token', {
        from: deployer,
        contract: 'BaseERC20Token',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: 'initialize',
                args: [
                    "Base ERC20 Token",    // Token name - configurable
                    "BERC20",              // Token symbol - configurable
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
        console.log("BaseERC20Token deployed at:", result.address);
    }
};

deployBaseERC20Token.tags = ['BaseERC20Token', 'tokens'];
export default deployBaseERC20Token;