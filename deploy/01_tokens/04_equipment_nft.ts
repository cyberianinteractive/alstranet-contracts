// deploy/02_nfts/01_equipment_nft.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployEquipmentNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const {
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader
    } = await getNamedAccounts();

    // For simplicity, we're using the same addresses for the additional roles
    const templateManager = defaultAdmin;
    const statsManager = defaultAdmin;
    const equipmentUpgrader = defaultAdmin;

    console.log("Deploying EquipmentNFT with deployer:", deployer);

    // Deploy the implementation and proxy
    const result = await deploy('EquipmentNFT', {
        from: deployer,
        contract: 'EquipmentNFT',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: 'initialize',
                args: [
                    defaultAdmin,
                    pauser,
                    minter,
                    upgrader,
                    templateManager,
                    statsManager,
                    equipmentUpgrader
                ],
            },
        },
        log: true,
    });

    if (result.newlyDeployed) {
        console.log("EquipmentNFT deployed at:", result.address);
        
        // Log role assignments
        console.log("Role assignments:");
        console.log(" - Default Admin:", defaultAdmin);
        console.log(" - Pauser:", pauser);
        console.log(" - Minter:", minter);
        console.log(" - Upgrader:", upgrader);
        console.log(" - Template Manager:", templateManager);
        console.log(" - Stats Manager:", statsManager);
        console.log(" - Equipment Upgrader:", equipmentUpgrader);
    }
};

deployEquipmentNFT.tags = ['EquipmentNFT', 'nfts'];
// Add this line to specify the dependency
deployEquipmentNFT.dependencies = ['BaseERC1155Token'];
export default deployEquipmentNFT;