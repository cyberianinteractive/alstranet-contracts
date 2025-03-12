// deploy/03_governance.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

/**
 * Deploys the TimelockController and BaseGovernor contracts
 * This script depends on the AlstraToken deployment
 */
const deployGovernance: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

    // Get AlstraToken address - this is a dependency
    const AlstraToken = await deployments.get('AlstraToken');

    console.log("Deploying governance contracts with deployer:", deployer);
    console.log("Using AlstraToken at:", AlstraToken.address);

    // -------- Deploy TimelockController --------

    // Configuration for TimelockController
    const minDelay = 86400; // 24 hours in seconds

    // Initially set the deployer and admin as proposers
    // In a production environment, you may want to set this to faction treasuries or other governance entities
    const proposers = [deployer, defaultAdmin];

    // Set executor role to address(0) to allow anyone to execute
    // This is more decentralized but you could also restrict to specific addresses
    const executors = ["0x0000000000000000000000000000000000000000"]; // Allow anyone to execute

    // Set initial admin (will eventually be transferred to the governor itself)
    const timelockAdmin = deployer;

    console.log("Deploying TimelockController with:");
    console.log("- Minimum delay:", minDelay, "seconds");
    console.log("- Proposers:", proposers);
    console.log("- Executors: Anyone (address 0)");
    console.log("- Admin:", timelockAdmin);

    // Deploy TimelockController
    const timelockResult = await deploy('TimelockController', {
        from: deployer,
        contract: 'TimelockControllerUpgradeable',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: 'initialize',
                args: [
                    minDelay,
                    proposers,
                    executors,
                    timelockAdmin
                ],
            },
        },
        log: true,
    });

    console.log("TimelockController deployed at:", timelockResult.address);

    // -------- Deploy BaseGovernor --------

    // Configuration for BaseGovernor
    const votingDelay = 86400; // 1 day in seconds
    const votingPeriod = 432000; // 5 days in seconds

    // Calculate proposal threshold (0.1% of total supply)
    // This requires some tokens to create a proposal to prevent spam
    const alstraTokenContract = await ethers.getContractAt('AlstraToken', AlstraToken.address);
    const totalSupply = await alstraTokenContract.totalSupply();
    const proposalThreshold = totalSupply / 1000n; // 0.1% of total supply

    // Quorum percentage (5%)
    const quorumNumerator = 5;

    console.log("Deploying BaseGovernor with:");
    console.log("- Voting Delay:", votingDelay, "seconds");
    console.log("- Voting Period:", votingPeriod, "seconds");
    console.log("- Proposal Threshold:", proposalThreshold.toString(), "tokens");
    console.log("- Quorum:", quorumNumerator, "%");

    // Deploy BaseGovernor
    const governorResult = await deploy('BaseGovernor', {
        from: deployer,
        contract: 'BaseGovernor',
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                methodName: 'initialize',
                args: [
                    AlstraToken.address,            // token
                    timelockResult.address,         // timelock
                    defaultAdmin,                   // initialOwner
                    votingDelay,                    // _votingDelay
                    votingPeriod,                   // _votingPeriod
                    proposalThreshold,              // _proposalThreshold
                    quorumNumerator                 // _quorumNumerator
                ],
            },
        },
        log: true,
    });

    console.log("BaseGovernor deployed at:", governorResult.address);

    // -------- Post-Deployment Setup --------

    // After deployment, you might want to set up the governance system:
    // 1. Grant the governor contract proposer role in the timelock
    // 2. Transfer timelock admin role to the timelock itself for full decentralization
    // 3. Set up faction-specific roles

    // This can be done in a separate script after confirming the deployment works
    console.log("");
    console.log("IMPORTANT: Post-deployment setup required:");
    console.log("1. Grant the BaseGovernor contract PROPOSER_ROLE in TimelockController");
    console.log("2. Revoke admin role from deployer and transfer to TimelockController itself");
    console.log("3. Set up faction-specific roles for your game ecosystem");
};

deployGovernance.tags = ['Governance', 'TimelockController', 'BaseGovernor'];
deployGovernance.dependencies = ['AlstraToken']; // This makes sure AlstraToken is deployed first

export default deployGovernance;