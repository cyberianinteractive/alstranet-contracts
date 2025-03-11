// deploy/tokens/00_base_nft721_token.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployBaseERC721Token: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const {
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader,
        // defaultAdmin will also be the URI setter by default
    } = await getNamedAccounts();

    console.log("Deploying BaseERC721Token with deployer:", deployer);

    // Deploy the implementation and proxy
    const result = await deploy('BaseERC721Token', {
        from: deployer,
        contract: 'BaseERC721Token',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: 'initialize',
                args: [
                    "Base NFT 721 Token",  // Token name - configurable
                    "BNFT721",             // Token symbol - configurable
                    "1",                   // Version for EIP712 - configurable
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
        console.log("BaseERC721Token deployed at:", result.address);
    }
};

deployBaseERC721Token.tags = ['BaseERC721Token', 'nfts'];
export default deployBaseERC721Token;