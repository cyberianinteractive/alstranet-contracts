// deploy/99_deploy_test_wrappers.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

/**
 * Deployment script for test wrapper contracts
 * This script deploys wrapper contracts that expose library functions for testing
 * It only runs on test networks (hardhat, localhost) and is skipped on production deployments
 */
const deployTestWrappers: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // Only deploy test wrappers on test networks
    const isTestNetwork = hre.network.name === "hardhat" || hre.network.name === "localhost";

    if (!isTestNetwork) {
        console.log("Skipping test wrapper deployment on non-test network:", hre.network.name);
        return;
    }

    console.log("Deploying test wrapper contracts with deployer:", deployer);

    // Deploy TerritoryLibraryTestWrapper
    console.log("Deploying TerritoryLibraryTestWrapper...");
    const territoryLibraryWrapperResult = await deploy('TerritoryLibraryTestWrapper', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (territoryLibraryWrapperResult.newlyDeployed) {
        console.log(`TerritoryLibraryTestWrapper deployed at ${territoryLibraryWrapperResult.address}`);
    } else {
        console.log(`Reusing existing TerritoryLibraryTestWrapper at ${territoryLibraryWrapperResult.address}`);
    }

    // Deploy StakingLibraryTestWrapper
    console.log("Deploying StakingLibraryTestWrapper...");
    const stakingLibraryWrapperResult = await deploy('StakingLibraryTestWrapper', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (stakingLibraryWrapperResult.newlyDeployed) {
        console.log(`StakingLibraryTestWrapper deployed at ${stakingLibraryWrapperResult.address}`);
    } else {
        console.log(`Reusing existing StakingLibraryTestWrapper at ${stakingLibraryWrapperResult.address}`);
    }

    // Deploy FactionLibraryTestWrapper
    console.log("Deploying FactionLibraryTestWrapper...");
    const factionLibraryWrapperResult = await deploy('FactionLibraryTestWrapper', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (factionLibraryWrapperResult.newlyDeployed) {
        console.log(`FactionLibraryTestWrapper deployed at ${factionLibraryWrapperResult.address}`);
    } else {
        console.log(`Reusing existing FactionLibraryTestWrapper at ${factionLibraryWrapperResult.address}`);
    }

    // Deploy FeeLibraryTestWrapper
    console.log("Deploying FeeLibraryTestWrapper...");
    const feeLibraryWrapperResult = await deploy('FeeLibraryTestWrapper', {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true
    });

    if (feeLibraryWrapperResult.newlyDeployed) {
        console.log(`FeeLibraryTestWrapper deployed at ${feeLibraryWrapperResult.address}`);
    } else {
        console.log(`Reusing existing FeeLibraryTestWrapper at ${feeLibraryWrapperResult.address}`);
    }

    // Additional test wrappers would be deployed here
    // e.g., RevenueLibraryTestWrapper, etc.

    console.log("Test wrapper deployment complete.");
};

// Set tags to identify this as a test-only deployment
deployTestWrappers.tags = [
    'TestOnly', 
    'TestWrappers', 
    'TerritoryLibraryTestWrapper', 
    'StakingLibraryTestWrapper', 
    'FactionLibraryTestWrapper',
    'FeeLibraryTestWrapper'
];

// Make this run after other deployments
// deployTestWrappers.runAtTheEnd = true;

export default deployTestWrappers;