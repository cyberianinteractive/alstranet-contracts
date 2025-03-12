// deploy/01_libraries/01_deploy_libraries.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

/**
 * Deployment script for core game libraries
 * This script handles the deployment of all library contracts used by the Police & Thief ecosystem
 */
const deployGameLibraries: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying core game libraries with deployer:", deployer);

    // Step 1: Deploy TerritoryLibrary
    console.log("Deploying TerritoryLibrary...");
    const territoryLibraryResult = await deploy('TerritoryLibrary', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (territoryLibraryResult.newlyDeployed) {
        console.log(`TerritoryLibrary deployed at ${territoryLibraryResult.address}`);
    } else {
        console.log(`Reusing existing TerritoryLibrary at ${territoryLibraryResult.address}`);
    }

    // Step 2: Deploy FactionLibrary
    console.log("Deploying FactionLibrary...");
    const factionLibraryResult = await deploy('FactionLibrary', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (factionLibraryResult.newlyDeployed) {
        console.log(`FactionLibrary deployed at ${factionLibraryResult.address}`);
    } else {
        console.log(`Reusing existing FactionLibrary at ${factionLibraryResult.address}`);
    }

    // Log information about deployed libraries for reference
    console.log("Deployed libraries:");
    console.log(`- TerritoryLibrary: ${territoryLibraryResult.address}`);
    console.log(`- FactionLibrary: ${factionLibraryResult.address}`);
};

// Set tags for selective deployments and dependencies
deployGameLibraries.tags = ['Libraries', 'TerritoryLibrary', 'FactionLibrary'];

export default deployGameLibraries;