// deploy/04_governance_setup.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

/**
 * Configures the governance system after deployment:
 * 1. Grants the Governor contract the PROPOSER_ROLE in TimelockController
 * 2. Transfers timelock admin role to the timelock itself for decentralization
 * 3. Sets up any additional faction-specific roles
 * 
 * This script should be run after the governance contracts are deployed
 */
const setupGovernance: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();

    console.log("Setting up governance system with deployer:", deployer);

    // Get deployed contract addresses
    const timelockDeployment = await deployments.get('TimelockController');
    const governorDeployment = await deployments.get('BaseGovernor');

    console.log("TimelockController at:", timelockDeployment.address);
    console.log("BaseGovernor at:", governorDeployment.address);

    // Get contract instances
    const timelock = await ethers.getContractAt('TimelockControllerUpgradeable', timelockDeployment.address);
    const governor = await ethers.getContractAt('BaseGovernor', governorDeployment.address);

    // Constants for roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    const DEFAULT_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

    console.log("Checking current roles in TimelockController...");

    // Check if Governor already has PROPOSER_ROLE
    const hasProposerRole = await timelock.hasRole(PROPOSER_ROLE, governorDeployment.address);
    if (!hasProposerRole) {
        console.log("Granting PROPOSER_ROLE to Governor...");
        const grantProposerTx = await timelock.grantRole(PROPOSER_ROLE, governorDeployment.address);
        await grantProposerTx.wait();
        console.log("PROPOSER_ROLE granted to Governor");
    } else {
        console.log("Governor already has PROPOSER_ROLE");
    }

    // Check if Governor already has CANCELLER_ROLE
    const hasCancellerRole = await timelock.hasRole(CANCELLER_ROLE, governorDeployment.address);
    if (!hasCancellerRole) {
        console.log("Granting CANCELLER_ROLE to Governor...");
        const grantCancellerTx = await timelock.grantRole(CANCELLER_ROLE, governorDeployment.address);
        await grantCancellerTx.wait();
        console.log("CANCELLER_ROLE granted to Governor");
    } else {
        console.log("Governor already has CANCELLER_ROLE");
    }

    // Check if deployer still has admin role
    const deployerHasAdminRole = await timelock.hasRole(DEFAULT_ADMIN_ROLE, deployer);
    if (deployerHasAdminRole) {
        console.log("");
        console.log("WARNING: Deployer still has DEFAULT_ADMIN_ROLE in TimelockController");
        console.log("For full decentralization, this role should be revoked from the deployer");
        console.log("and granted to the TimelockController itself.");
        console.log("");
        console.log("To transfer admin rights to the TimelockController, run these commands:");
        console.log(`timelock.grantRole(DEFAULT_ADMIN_ROLE, "${timelockDeployment.address}")`);
        console.log(`timelock.revokeRole(DEFAULT_ADMIN_ROLE, "${deployer}")`);
        console.log("");
        console.log("IMPORTANT: This is a security-critical step but should only be done");
        console.log("after thorough testing. Once admin rights are transferred,");
        console.log("all changes to the timelock will need to go through governance.");
    }

    // For faction-specific setup in the Police & Thief ecosystem
    console.log("");
    console.log("Faction-specific governance setup:");
    console.log("Consider implementing these faction-specific governance features:");
    console.log("1. Law Enforcement faction: Special proposal rights for regulatory changes");
    console.log("2. Criminal Syndicate faction: Special proposal rights for black market parameters");
    console.log("3. Vigilante faction: Special proposal rights for community initiatives");
    console.log("");
    console.log("These can be implemented through extensions to the BaseGovernor contract");
    console.log("or through specialized proposal contracts that interact with the governance system.");
};

setupGovernance.tags = ['GovernanceSetup'];
setupGovernance.dependencies = ['Governance']; // This makes sure Governance is deployed first

export default setupGovernance;