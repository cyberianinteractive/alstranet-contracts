// deploy/01_tokens/03_base_erc1155_token.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployBaseERC1155Token: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const {
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader
    } = await getNamedAccounts();

    console.log("Deploying BaseERC1155Token with deployer:", deployer);

    // Deploy the implementation and proxy
    const result = await deploy('BaseERC1155Token', {
        from: deployer,
        contract: 'BaseERC1155Token',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: '__BaseERC1155Token_init',
                args: [
                    "", // Initial URI - empty string, can be set later
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
        console.log("BaseERC1155Token deployed at:", result.address);
    }
};

deployBaseERC1155Token.tags = ['BaseERC1155Token', 'tokens'];
export default deployBaseERC1155Token;